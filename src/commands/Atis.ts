import {
    AudioPlayer,
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    DiscordGatewayAdapterCreator,
    joinVoiceChannel,
    VoiceConnectionStatus
} from "@discordjs/voice";
import { Category, NotBot } from "@discordx/utilities";
import type { AutocompleteInteraction, CommandInteraction, MessageActionRowComponentBuilder } from "discord.js";
import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    ButtonBuilder,
    ButtonInteraction,
    EmbedBuilder,
    Formatters,
    GuildMember,
    VoiceBasedChannel
} from "discord.js";
import { ButtonStyle } from "discord-api-types/payloads/v10/channel.js";
import { Client, Discord, Guard, Slash, SlashGroup, SlashOption } from "discordx";
import Text2Speech from "node-gtts";
import tmp from "tmp";
import { injectable } from "tsyringe";

import { GuildOnly } from "../guards/GuildOnly.js";
import { RequiredBotPerms } from "../guards/RequiredBotPerms.js";
import { AirportManager } from "../model/framework/manager/AirportManager.js";
import { AvwxManager } from "../model/framework/manager/AvwxManager.js";
import logger from "../utils/LoggerFactory.js";
import { InteractionUtils } from "../utils/Utils.js";

@Discord()
@Category("Advisory")
@SlashGroup({ name: "atis" })
@SlashGroup("atis")
@injectable()
export class Atis {
    private readonly _audioPlayers: Map<string, AudioPlayer> = new Map();
    // map of <icao, <speechText, File>>
    private readonly _atisMap: Map<string, Map<string, Record<string, any>>> = new Map();

    public constructor(private _avwxManager: AvwxManager) {}

    @Slash("text", {
        description: "Gives you the live ATIS as text for the chosen airport"
    })
    @Guard(
        NotBot,
        RequiredBotPerms({
            textChannel: ["EmbedLinks"]
        })
    )
    public async atisText(
        @SlashOption("icao", {
            autocomplete: (interaction: AutocompleteInteraction) => InteractionUtils.search(interaction, AirportManager),
            description: "What ICAO would you like the bot to give ATIS for?",
            type: ApplicationCommandOptionType.String,
            required: true
        })
        icao: string,
        interaction: CommandInteraction,
        client: Client
    ): Promise<void> {
        await interaction.deferReply();
        icao = icao.toUpperCase();

        const atisEmbed = new EmbedBuilder()
            .setTitle(`ATIS: ${Formatters.inlineCode(icao)}`)
            .setColor("#0099ff")
            .setFooter({
                text: `${client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: AVWX`
            })
            .setTimestamp();
        try {
            const { speech } = await this._avwxManager.getMetar(icao);
            atisEmbed.setDescription(Formatters.codeBlock(speech));
        } catch (error) {
            logger.error(`[${client.shard.ids}] ${error}`);
            atisEmbed.setColor("#ff0000").setDescription(`${interaction.member}, ${error.message}`);
        }

        return InteractionUtils.replyOrFollowUp(interaction, {
            embeds: [atisEmbed]
        });
    }

    @Slash("voice", {
        description: "Gives you the live ATIS as voice for the chosen airport"
    })
    @Guard(
        NotBot,
        RequiredBotPerms({
            textChannel: ["EmbedLinks"],
            voice: ["Connect", "Speak"]
        }),
        GuildOnly
    )
    public async atisVoice(
        @SlashOption("icao", {
            autocomplete: (interaction: AutocompleteInteraction) => InteractionUtils.search(interaction, AirportManager),
            description: "What ICAO would you like the bot to give ATIS for?",
            type: ApplicationCommandOptionType.String,
            required: true
        })
        icao: string,
        interaction: CommandInteraction,
        client: Client
    ): Promise<void> {
        await interaction.deferReply();
        icao = icao.toUpperCase();

        const atisEmbed = new EmbedBuilder()
            .setTitle(`ATIS: ${Formatters.inlineCode(icao)}`)
            .setColor("#0099ff")
            .setFooter({
                text: `${client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: AVWX`
            })
            .setTimestamp();
        let atisFound = false;
        const voiceChannel = (interaction.member as GuildMember).voice.channel;
        try {
            await this.play(voiceChannel, interaction, client, atisEmbed, icao);
            atisFound = true;
        } catch (error) {
            logger.error(`[${client.shard.ids}] ${error}`);
        }
        if (!atisFound) {
            atisEmbed.setColor("#ff0000").setDescription(`${interaction.member}, no ATIS available at the moment for ${icao}`);
            return InteractionUtils.replyOrFollowUp(interaction, {
                embeds: [atisEmbed]
            });
        }
    }

    private getAudioPlayer(guildId: string): AudioPlayer {
        if (this._audioPlayers.has(guildId)) {
            return this._audioPlayers.get(guildId);
        }
        const audioPlayer = createAudioPlayer();
        this._audioPlayers.set(guildId, audioPlayer);
        return audioPlayer;
    }

    private async play(voiceChannel: VoiceBasedChannel, interaction: CommandInteraction, client: Client, embed: EmbedBuilder, icao: string): Promise<void> {
        const { guildId } = voiceChannel;
        const file = await this.saveSpeechToFile(icao, embed);
        const resource = createAudioResource(file.name);
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator
        });
        const audioPlayer = this.getAudioPlayer(guildId);
        connection.subscribe(audioPlayer);
        audioPlayer.play(resource);
        audioPlayer.on(AudioPlayerStatus.Idle, async () => {
            const isChannelEmpty = voiceChannel.members.filter((member) => member.id !== client.user.id).size === 0;
            if (isChannelEmpty) {
                if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                    connection.destroy();
                }
            } else {
                const newFIle = await this.saveSpeechToFile(icao, embed);
                audioPlayer.play(createAudioResource(newFIle.name));
            }
        });

        connection.on(VoiceConnectionStatus.Destroyed, async () => {
            await interaction.editReply({
                components: []
            });
            this._audioPlayers.delete(guildId);
        });

        const state = audioPlayer.state.status;
        const stopButton = new ButtonBuilder()
            .setLabel("Stop")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(state === AudioPlayerStatus.Playing)
            .setCustomId("btn-stop");
        const buttonRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(stopButton);

        const message = await interaction.followUp({
            embeds: [embed],
            fetchReply: true,
            components: [buttonRow]
        });

        const collector = message.createMessageComponentCollector();

        collector.on("collect", async (collectInteraction: ButtonInteraction) => {
            const memberActivated = collectInteraction.member as GuildMember;
            // ensure the member who clicked this button is also in the voice channel
            if (memberActivated?.voice?.channelId !== voiceChannel.id) {
                return;
            }
            await collectInteraction.deferUpdate();
            const buttonId = collectInteraction.customId;
            if (buttonId === "btn-stop") {
                connection.destroy();
            }
            collector.stop();
        });
    }

    private async saveSpeechToFile(icao: string, embed: EmbedBuilder): Promise<Record<string, any>> {
        const { speech } = await this._avwxManager.getMetar(icao);
        embed.setDescription(Formatters.codeBlock(speech));
        if (this._atisMap.has(icao)) {
            const storedSpeech = this._atisMap.get(icao);
            if (storedSpeech.has(speech)) {
                return storedSpeech.get(speech);
            }
        }

        const tmpObj = tmp.fileSync({
            postfix: ".mp3"
        });
        return new Promise((resolve) => {
            const speechOb = Text2Speech("en-uk");
            speechOb.save(tmpObj.name, speech, () => {
                const fileMap = new Map();
                fileMap.set(speech, tmpObj);
                this._atisMap.set(icao, fileMap);
                resolve(tmpObj);
            });
        });
    }
}
