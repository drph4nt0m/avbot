import {
    AudioPlayer,
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    DiscordGatewayAdapterCreator,
    joinVoiceChannel,
    VoiceConnectionStatus
} from "@discordjs/voice";
import {Category, NotBot} from "@discordx/utilities";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import {
    AutocompleteInteraction,
    ButtonInteraction,
    CommandInteraction,
    GuildMember,
    Message,
    MessageActionRow,
    MessageButton,
    MessageEmbed,
    VoiceBasedChannel
} from "discord.js";
import {Client, Discord, Guard, Slash, SlashOption} from "discordx";
import Text2Speech from "node-gtts";
import tmp from "tmp";
import {injectable} from "tsyringe";

import {GuildOnly} from "../guards/GuildOnly.js";
import {RequiredBotPerms} from "../guards/RequiredBotPerms.js";
import {AirportManager} from "../model/framework/manager/AirportManager.js";
import {AvwxManager} from "../model/framework/manager/AvwxManager.js";
import logger from "../utils/LoggerFactory.js";
import {InteractionUtils} from "../utils/Utils.js";

dayjs.extend(utc);

@Discord()
@Category("Weather commands")
@injectable()
export class AtisVoice {

    public constructor(private _avwxManager: AvwxManager,
                       private _airportManager: AirportManager) {
    }

    private readonly _audioPlayer: AudioPlayer = createAudioPlayer();

    // map of <icao, <speechText, File>>
    private readonly _atisMap: Map<string, Map<string, Record<string, any>>> = new Map();


    @Slash("atis-voice", {
        description: "Gives you the live ATIS as voice for the chosen airport"
    })
    @Guard(NotBot, RequiredBotPerms({
        textChannel: ["EMBED_LINKS"],
        voice: ["CONNECT", "SPEAK"]
    }), GuildOnly)
    private async atisVoice(
        @SlashOption("icao", {
            autocomplete: (interaction: AutocompleteInteraction) => InteractionUtils.search(interaction, AirportManager),
            description: "What ICAO would you like the bot to give ATIS for?",
            type: "STRING",
            required: true
        })
            icao: string,
        interaction: CommandInteraction,
        client: Client
    ): Promise<void> {
        await interaction.deferReply();

        const atisEmbed = new MessageEmbed()
            .setTitle(`ATIS for ${icao.toUpperCase()}`)
            .setColor("#0099ff")
            .setFooter({
                text: `${client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: AVWX`
            })
            .setTimestamp();
        let atisFound = false;
        const voiceChannel = ((interaction.member) as GuildMember).voice.channel;
        try {
            await this.play(voiceChannel, interaction, client, atisEmbed, icao);
            atisFound = true;
        } catch (error) {
            logger.error(`[${client.shard.ids}] ${error}`);
        }
        if (!atisFound) {
            // TODO change this error message
            return InteractionUtils.replyOrFollowUp(interaction, `${icao} not found`);
        }
    }

    private async play(voiceChannel: VoiceBasedChannel, interaction: CommandInteraction, client: Client, embed: MessageEmbed, icao: string): Promise<void> {
        const file = await this.saveSpeechToFile(icao, embed);
        const resource = createAudioResource(file.name);
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator
        });
        connection.subscribe(this._audioPlayer);
        this._audioPlayer.play(resource);
        this._audioPlayer.on(AudioPlayerStatus.Idle, async () => {
            const isChannelEmpty = voiceChannel.members.filter(member => member.id !== client.user.id).size === 0;
            if (isChannelEmpty) {
                if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                    connection.destroy();
                }
            } else {
                const newFIle = await this.saveSpeechToFile(icao, embed);
                this._audioPlayer.play(createAudioResource(newFIle.name));
            }
        });

        connection.on(VoiceConnectionStatus.Destroyed, async () => {
            await interaction.deleteReply();
        });

        const state = this._audioPlayer.state.status;
        const stopButton = new MessageButton()
            .setLabel("Stop")
            .setStyle("DANGER")
            .setDisabled(state === AudioPlayerStatus.Playing)
            .setCustomId("btn-stop");
        const row = new MessageActionRow().addComponents(stopButton);

        const message: Message = await interaction.followUp({
            embeds: [embed],
            fetchReply: true,
            components: [row]
        }) as Message;

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

    private async saveSpeechToFile(icao: string, embed: MessageEmbed): Promise<Record<string, any>> {
        const {speech} = await this._avwxManager.getMetar(icao);
        embed.setDescription(speech);
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