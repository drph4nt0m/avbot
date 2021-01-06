<p align="center">
  <img src="https://i.postimg.cc/RFSGH8FQ/logo.png" alt="AvBot" width="200" height="200" />
</p>

<h1 align="center">AvBot</h1>
<h3 align="center"3>Aviation enthusiast's friendly neighborhood bot</h3>

<p align="center">
  <a href="#"><img src="https://img.shields.io/github/package-json/v/drph4nt0m/avbot-v3/main?style=for-the-badge" alt="Version"></a>
  <a href="https://github.com/drph4nt0m/avbot-v3/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0--only-orange?style=for-the-badge" alt="License"></a>
  <a href="https://depfu.com/repos/github/drph4nt0m/avbot-v3"><img src="https://img.shields.io/depfu/drph4nt0m/avbot-v3?style=for-the-badge" alt="Dependencies"></a>
</p>

<p align="center">
  <a href="https://lgtm.com/projects/g/drph4nt0m/avbot-v3"><img src="https://img.shields.io/lgtm/grade/javascript/github/drph4nt0m/avbot-v3?style=for-the-badge" alt="LGTM grade"></a>
  <a href="https://app.codacy.com/gh/drph4nt0m/avbot-v3/dashboard"><img src="https://img.shields.io/codacy/grade/90894e1b201e460b853eb1ba915b90d4?style=for-the-badge" alt="Codacy grade"></a>
</p>

<p align="center">
  <a href="https://github.com/drph4nt0m/avbot-v3/actions?query=workflow%3ACodeQL"><img src="https://img.shields.io/github/workflow/status/drph4nt0m/avbot-v3/CodeQL?style=for-the-badge" alt="CodeQL"></a>
  <a href="https://github.com/drph4nt0m/avbot-v3/actions?query=workflow%3A%22Codacy+Security+Scan%22"><img src="https://img.shields.io/github/workflow/status/drph4nt0m/avbot-v3/Codacy%20Security%20Scan?style=for-the-badge" alt="Codacy Security Scan"></a>
  <a href="https://github.com/drph4nt0m/avbot-v3/actions?query=workflow%3AESLint"><img src="https://img.shields.io/github/workflow/status/drph4nt0m/avbot-v3/ESLint?style=for-the-badge" alt="ESLint"></a>
  <a href="https://github.com/drph4nt0m/avbot-v3/actions?query=workflow%3APrettier"><img src="https://img.shields.io/github/workflow/status/drph4nt0m/avbot-v3/Prettier?style=for-the-badge" alt="Prettier"></a>
</p>

<p align="center">
  
  <a href="./CODE_OF_CONDUCT.md"><img src="https://img.shields.io/badge/Contributor%20Covenant-v2.0%20adopted-ff69b4?style=for-the-badge" alt="Contributor Covenant"></a>
  <a href="#"><img src="https://img.shields.io/tokei/lines/github/drph4nt0m/avbot-v3?style=for-the-badge" alt="Lines of code"></a>
  <a href="https://github.com/prettier/prettier"><img src="https://img.shields.io/badge/styled_with-prettier-ff69b4.svg?style=for-the-badge&logo=prettier" alt="Prettier"></a>
</p>

<p align="center">
  <a href="https://discord.gg/fjNqtz6"><img src="https://discord.com/api/guilds/524087427875209227/embed.png?style=banner3" alt="Discord"></a>
 </p>

## Commands

| command       | example             | description                                                                                         |
| ------------- | ------------------- | --------------------------------------------------------------------------------------------------- |
| metar         | !metar VABB         | Gives you the live METAR for the chosen airport                                                     |
| taf           | !taf VABB           | Gives you the live TAF for the chosen airport                                                       |
| brief         | !brief VABB         | Gives you the live METAR, zulu time and the latest chart for the chosen airport                     |
| atis          | !atis VABB          | Gives you the live ATIS for the chosen airport                                                      |
| atis-voice    | !atis VABB          | Gives you the live ATIS as voice for the chosen airport                                             |
| icao          | !icao VABB          | Gives you the station information for the chosen airport                                            |
| chart (wip)   | !chart VABB         | Gives you the the latest chart for the chosen airport                                               |
| ivao          | !ivao AIC001        | Gives you the information for the chosen call sign on the IVAO network                              |
| ivao-online   | !ivao-online VABB   | Gives you the information for all ATCs which match the given partial callsign on the IVAO network   |
| vatsim        | !vatsim VABB        | Gives you the information for the chosen call sign on the VATSIM network                            |
| vatsim-online | !vatsim-online VABB | Gives you the information for all ATCs which match the given partial callsign on the VATSIM network |
| zulu          | !zulu               | Gives you the current zulu time                                                                     |
| zulu          | !zulu VABB 1900     | Gives you the specific zulu time for the given local Time and ICAO                                  |
| local         | !local VABB 1900    | Gives you the specific local time for the given zulu Time and ICAO                                  |
| invite        | !invite             | Gives you the AvBot invite link to add it to your Discord server                                    |
| prefix        | !prefix             | Change or view AvBot's prefix                                                                       |
| help          | !help               | Displays a list of available commands                                                               |
| help          | !help metar         | Displays a detailed information for a specified command                                             |
| ping          | !ping               | Checks the AvBot's ping to the Discord server                                                       |
| donate        | !donate             | Support AvBot by donating                                                                           |

## License

<a href="https://app.fossa.com/projects/git%2Bgithub.com%2Fdrph4nt0m%2Favbot-v3?ref=badge_large"><img src="https://app.fossa.com/api/projects/git%2Bgithub.com%2Fdrph4nt0m%2Favbot-v3.svg?type=large" alt="FOSSA Status"/></a>

## A note to aspiring developers/aviation enthusiasts who want to self host AvBot

We are not supportive of the idea of people self hosting AvBot because the dev team has put a very high priority on providing the best experience we can. This repository will be deleted if people self-host it as they will not use the same setup to what we do and will most likely not put the same amount of effort we do. If AvBot is lacking a feature you'd like to see, please refer to the developing guidelines and if you can add that feature it will be in to stay.

Plus, as AvBot grows we will continue to rely on MANY, MANY more external services to provide it's function.

## Contributing

Pull requests are welcome.
See the [CONTRIBUTING](./CONTRIBUTING.md) file for more instructions.
For major changes, please open an issue first to
discuss what you would like to change.

## Contributors ✨

Thanks goes to these wonderful people
([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="http://dr.ph4nt0m.me"><img src="https://avatars0.githubusercontent.com/u/22918499?v=4" width="100px;" alt=""/><br /><sub><b>Rahul Singh</b></sub></a><br /><a href="#infra-drph4nt0m" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/drph4nt0m/avbot-v3/commits?author=drph4nt0m" title="Code">💻</a> <a href="https://github.com/drph4nt0m/avbot-v3/commits?author=drph4nt0m" title="Documentation">📖</a></td>
    <td align="center"><a href="https://xkcd.com/1597/"><img src="https://avatars2.githubusercontent.com/u/44368997?v=4" width="100px;" alt=""/><br /><sub><b>Joshua T.</b></sub></a><br /><a href="https://github.com/drph4nt0m/avbot-v3/commits?author=radiantly" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/Fedelaus"><img src="https://avatars2.githubusercontent.com/u/43784056?v=4" width="100px;" alt=""/><br /><sub><b>Nathan Dawson</b></sub></a><br /><a href="https://github.com/drph4nt0m/avbot-v3/commits?author=Fedelaus" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/ransbachm"><img src="https://avatars0.githubusercontent.com/u/25692733?v=4" width="100px;" alt=""/><br /><sub><b>ransbachm</b></sub></a><br /><a href="https://github.com/drph4nt0m/avbot-v3/commits?author=ransbachm" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the
[all-contributors](https://github.com/all-contributors/all-contributors)
specification. Contributions of any kind welcome!

## Hosting

Thanks www.openode.io for the hosting!
