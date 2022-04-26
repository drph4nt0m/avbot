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
import type {AutocompleteInteraction, CommandInteraction, VoiceBasedChannel} from "discord.js";
import {ButtonInteraction, GuildMember, Message, MessageActionRow, MessageButton, MessageEmbed} from "discord.js";
import {Client, Discord, Guard, Slash, SlashOption} from "discordx";
import Text2Speech from "node-gtts";
import tmp from "tmp";
import {injectable} from "tsyringe";

import {GuildOnly} from "../guards/GuildOnly.js";
import {RequiredBotPerms} from "../guards/RequiredBotPerms.js";
import {AirportManager} from "../model/framework/manager/AirportManager.js";
import {AvwxManager} from "../model/framework/manager/AvwxManager.js";
import {NatsManager} from "../model/framework/manager/NatsManager.js";
import logger from "../utils/LoggerFactory.js";
import {InteractionUtils, ObjectUtil} from "../utils/Utils.js";

dayjs.extend(utc);

@Discord()
@Category("Weather commands")
@injectable()
export class Weather {

    private readonly _audioPlayer: AudioPlayer = createAudioPlayer();
    // map of <icao, <speechText, File>>
    private readonly _atisMap: Map<string, Map<string, Record<string, any>>> = new Map();

    public constructor(private _avwxManager: AvwxManager,
                       private _natsManager: NatsManager,
                       private _airportManager: AirportManager) {
    }

    @Slash("metar", {
        description: "Gives you the live METAR for the chosen airport"
    })
    @Guard(NotBot, RequiredBotPerms({
        textChannel: ["EMBED_LINKS"]
    }))
    private async metar(
        @SlashOption("icao", {
            autocomplete: (interaction: AutocompleteInteraction) => InteractionUtils.search(interaction, AirportManager),
            description: "What ICAO would you like the bot to give METAR for?",
            type: "STRING",
            required: true
        })
            icao: string,
        @SlashOption("raw", {
            description: "Gives you the live raw METAR for the chosen airport",
            required: false
        })
            rawData: boolean,
        interaction: CommandInteraction,
        client: Client
    ): Promise<void> {
        await interaction.deferReply();
        const title = rawData ? `Raw METAR for ${icao.toUpperCase()}` : `METAR for ${icao.toUpperCase()}`;
        const metarEmbed = new MessageEmbed()
            .setTitle(title)
            .setColor("#0099ff")
            .setTimestamp();
        try {
            const {raw, readable} = await this._avwxManager.getMetar(icao);
            if (rawData) {
                metarEmbed.setDescription(raw);
            } else {
                metarEmbed
                    .addFields(
                        {
                            name: "Raw Report",
                            value: raw
                        },
                        {
                            name: "Readable Report",
                            value: readable
                        }
                    );
            }
        } catch (err) {
            logger.error(`[${client.shard.ids}] ${err}`);
            metarEmbed.setColor("#ff0000").setDescription(`${interaction.member}, ${err.message}`);
        }
        metarEmbed.setFooter({
            text: `${client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: AVWX`
        });
        return InteractionUtils.replyOrFollowUp(interaction, {
            embeds: [metarEmbed]
        });
    }

    @Slash("atis", {
        description: "Gives you the live ATIS for the chosen airport"
    })
    @Guard(NotBot, RequiredBotPerms({
        textChannel: ["EMBED_LINKS"]
    }))
    private async atis(
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
        const atisEmbed = new MessageEmbed()
            .setTitle(`ATIS for ${icao.toUpperCase()}`)
            .setFooter({
                text: `${client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: AVWX`
            })
            .setTimestamp();
        try {
            const {speech} = await this._avwxManager.getMetar(icao);
            atisEmbed.setDescription(speech);
        } catch (error) {
            logger.error(`[${client.shard.ids}] ${error}`);
            atisEmbed.setColor("#ff0000").setDescription(`${interaction.member}, ${error.message}`);
        }

        return InteractionUtils.replyOrFollowUp(interaction, {
            embeds: [atisEmbed]
        });
    }


    // TODO: this needs looked, it works, but might need improvements
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
        if (this._atisMap.has(icao)) {
            const storedSpeech = this._atisMap.get(icao);
            if (storedSpeech.has(speech)) {
                return storedSpeech.get(speech);
            }
        }

        embed.setDescription(speech);
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

    @Slash("brief", {
        description: "Gives you the live METAR, zulu time and the latest chart for the chosen airport"
    })
    @Guard(NotBot, RequiredBotPerms({
        textChannel: ["EMBED_LINKS"]
    }))
    private async brief(
        @SlashOption("icao", {
            autocomplete: (interaction: AutocompleteInteraction) => InteractionUtils.search(interaction, AirportManager),
            description: "What ICAO would you like the bot to BRIEF you for?",
            type: "STRING",
            required: true
        })
            icao: string,
        interaction: CommandInteraction,
        client: Client
    ): Promise<void> {
        const briefEmbed = new MessageEmbed()
            .setTitle(`BRIEF for ${icao}`)
            .setColor("#0099ff")
            .setTimestamp();

        const zuluTime = ObjectUtil.dayJs.utc().format("YYYY-MM-DD HH:mm:ss [Z]");
        briefEmbed.addField("**Zulu**", `${zuluTime}`);
        try {
            const {raw} = await this._avwxManager.getMetar(icao);
            briefEmbed.addField("**METAR**", raw);
        } catch (error) {
            logger.error(`[${client.shard.ids}] ${error}`);
        }

        try {
            const {raw} = await this._avwxManager.getTaf(icao);
            briefEmbed.addField("**TAF**", raw);
        } catch (error) {
            logger.error(`[${client.shard.ids}] ${error}`);
        }
        briefEmbed.setFooter({
            text: `${client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: AVWX`
        });

        return InteractionUtils.replyOrFollowUp(interaction, {
            embeds: [briefEmbed]
        });
    }

    @Slash("nats", {
        description: "Gives you the latest North Atlantic Track information"
    })
    @Guard(NotBot, RequiredBotPerms({
        textChannel: ["EMBED_LINKS"]
    }))
    private async nats(
        @SlashOption("ident", {
            description: "Which track would you like to get information about?",
            required: false
        })
            ident: string,
        interaction: CommandInteraction,
        client: Client
    ): Promise<void> {
        if (ObjectUtil.validString(ident)) {
            const natsEmbed = new MessageEmbed()
                .setTitle(`NAT | Track ${ident}`)
                .setColor("#0099ff")
                .setFooter({
                    text: client.user.username
                })
                .setTimestamp();
            try {
                const nat = await this._natsManager.getTrackInformation(ident);

                let route = "";
                nat.route.nodes.forEach((node) => {
                    route += `${node.ident} `;
                });
                natsEmbed.addField("Route", `${route}`);
                if (nat.route.eastLevels.length > 0) {
                    natsEmbed.addField("East levels", `${nat.route.eastLevels.join(", ")}`);
                }
                if (nat.route.westLevels.length > 0) {
                    natsEmbed.addField("West levels", `${nat.route.westLevels.join(", ")}`);
                }

                natsEmbed.addField(
                    "Validity",
                    `${dayjs(nat.validFrom).utc().format("YYYY-MM-DD HH:mm:ss [Z]")} to ${dayjs(nat.validTo).utc().format("YYYY-MM-DD HH:mm:ss [Z]")}`
                );
            } catch (error) {
                logger.error(`[${client.shard.ids}] ${error}`);
                natsEmbed.setColor("#ff0000").setDescription(`${interaction.member}, ${error.message}`);
            }
            return InteractionUtils.replyOrFollowUp(interaction, {
                embeds: [natsEmbed]
            });
        }
        const natsEmbed = new MessageEmbed()
            .setTitle("NATS")
            .setColor("#0099ff")
            .setFooter({
                text: `${client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: Flight Plan Database`
            })
            .setTimestamp();
        try {
            const nats = await this._natsManager.getAllTracks();

            nats.forEach((track) => {
                natsEmbed.addField(`${track.ident}`, `${track.route.nodes[0].ident}-${track.route.nodes[track.route.nodes.length - 1].ident}`);
            });
        } catch (error) {
            logger.error(`[${client.shard.ids}] ${error}`);
            natsEmbed.setColor("#ff0000").setDescription(`${interaction.member}, ${error.message}`);
        }
        return InteractionUtils.replyOrFollowUp(interaction, {
            embeds: [natsEmbed]
        });

    }

    @Slash("taf", {
        description: "Gives you the live TAF for the chosen airport"
    })
    @Guard(NotBot, RequiredBotPerms({
        textChannel: ["EMBED_LINKS"]
    }))
    private async taf(
        @SlashOption("icao", {
            autocomplete: (interaction: AutocompleteInteraction) => InteractionUtils.search(interaction, AirportManager),
            description: "What ICAO would you like the bot to give TAF for?",
            type: "STRING",
            required: true
        })
            icao: string,
        @SlashOption("raw", {
            description: "Gives you the live raw TAF for the chosen airport",
            required: false
        })
            rawData: boolean,
        interaction: CommandInteraction,
        client: Client
    ): Promise<void> {
        await interaction.deferReply();
        const tafEmbed = new MessageEmbed()
            .setTitle(`TAF for ${icao.toUpperCase()}`)
            .setColor("#0099ff")
            .setFooter({
                text: `${client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: AVWX`
            })
            .setTimestamp();
        try {
            const {raw, readable} = await this._avwxManager.getTaf(icao);

            if (rawData) {
                const rawTafEmbed = new MessageEmbed()
                    .setTitle(`Raw TAF for ${icao.toUpperCase()}`)
                    .setColor("#0099ff")
                    .setFooter({
                        text: `${client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: AVWX`
                    })
                    .setDescription(raw)
                    .setTimestamp();
                return InteractionUtils.replyOrFollowUp(interaction, {
                    embeds: [rawTafEmbed]
                });
            }

            if (readable.length < 600) {
                tafEmbed
                    .addFields(
                        {
                            name: "Raw Report",
                            value: raw
                        },
                        {
                            name: "Readable Report",
                            value: readable
                        }
                    );

                return InteractionUtils.replyOrFollowUp(interaction, {
                    embeds: [tafEmbed]
                });
            }

            // TODO: you can use discordx pagination
            const tafEmbeds: MessageEmbed[] = [];
            let tempEmbed = new MessageEmbed()
                .setTitle(`TAF for ${icao.toUpperCase()}`)
                .setColor("#0099ff")
                .addField("Raw Report", raw)
                .setFooter({
                    text: `${client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: AVWX`
                })
                .setTimestamp();

            tafEmbeds.push(tempEmbed);

            const readableList = readable.split(". ");
            let buffer = "";

            for (let i = 0; i < readableList.length; i += 1) {
                const currentLine = `${readableList[i]}. `;
                buffer += currentLine;
                if (buffer.length > 600) {
                    tempEmbed = new MessageEmbed()
                        .setTitle(`TAF for ${icao.toUpperCase()}`)
                        .setColor("#0099ff")
                        .addField(`Readable Report [${tafEmbeds.length}]`, buffer)
                        .setFooter({
                            text: `${client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: AVWX`
                        })
                        .setTimestamp();

                    tafEmbeds.push(tempEmbed);
                    buffer = "";
                }
            }

            tempEmbed = tafEmbed;
            if (buffer.length > 0) {
                tafEmbeds.push(tempEmbed.addField(`Readable Report [${tafEmbeds.length}]`, buffer));
            }
            for (let i = 0; i < tafEmbeds.length; i += 1) {
                tafEmbeds[i].setFooter({
                    text:
                        `${client.user.username} • Message ${i + 1} of ${
                            tafEmbeds.length
                        } • This is not a source for official briefing • Please use the appropriate forums • Source: AVWX`
                });
            }

            return InteractionUtils.replyOrFollowUp(interaction, {
                embeds: tafEmbeds
            });
        } catch (error) {
            logger.error(`[${client.shard.ids}] ${error}`);
        }

        InteractionUtils.replyOrFollowUp(interaction, {
            embeds: [tafEmbed]
        });
    }
}
