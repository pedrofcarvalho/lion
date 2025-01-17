import { ISlashCommand } from '../../common/slash';
import { IContainer, IHttpResponse } from '../../common/types';

interface IBreed {
  name: string;
  id: string;
}

const API_URL: string = 'https://api.thecatapi.com/v1/';
let breeds: IBreed[] = [];

const plugin: ISlashCommand = {
  commandName: 'cat',
  name: 'Cat Plugin',
  description: 'Generates pictures of cats.',
  options: [
    {
      name: 'breed',
      description: 'The breed of cat to generate. Or "list" to list all breeds.',
      type: 'STRING',
      required: false,
    },
  ],

  initialize(container) {
    container.httpService
      .get(`${API_URL}breeds`)
      .then((response: IHttpResponse) => {
        const breedsData = response.data;
        breeds = breedsData.map((breedData: IBreed) => {
          return {
            name: breedData.name.toLowerCase(),
            id: breedData.id.toLowerCase(),
          };
        });
      })
      .catch((err) => container.loggerService.warn(`Cat.plugin.ts::Unable to load data: ${err}`));
  },

  async execute({ interaction, container }) {
    if (breeds.length === 0) {
      interaction.reply('No breeds found at this time');
      return;
    }

    if (interaction.options.getString('breed') === 'list') {
      await interaction.reply({
        embeds: [getListEmbed(container)],
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    let searchCom = '';

    const breedIn = interaction.options.getString('breed')?.toLowerCase() ?? 'random';
    // checks if their was a bread was a breed, then if that breed is recognized
    const breedEntry = breeds.find((breed) => breed.name === breedIn);

    if (breedEntry !== undefined) {
      searchCom = '&breed_ids=' + breedEntry.id;
    } else if (breedIn !== 'random' && breedIn !== '') {
      interaction.followUp('Breed not found.');
      return;
    }

    // receives the according info and posts
    await container.httpService
      .get(`${API_URL}images/search?limit=1${searchCom}`)
      .then((response: IHttpResponse) => {
        interaction.followUp({
          files: [{ attachment: response.data[0].url, name: 'img.jpg' }],
        });
      })
      .catch((err) => container.loggerService.warn(err));
  },
};

const getListEmbed = (container: IContainer) => {
  const breedsAsArray = breeds.map((breedData: { name: string; id: string }) => {
    return breedData.name;
  });

  const embed = container.messageService.generateEmbedList(breedsAsArray);
  embed.setColor('#0099ff').setTitle('Breeds');

  return embed;
};

export default plugin;
