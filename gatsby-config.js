module.exports = {
  siteMetadata: {
    siteTitle: 'Lozano\´s Blog',
    siteDescription: 'Un blog de tecnología',
    siteImage: '/banner.png', // main image of the site for metadata
    siteUrl: 'https://lozan0.github.io/', //siteUrl: 'https://chronoblog-hacker.now.sh/',
    pathPrefix: '/',
    siteLanguage: 'en',
    ogLanguage: `en_US`,
    author: 'Lozano\´s Blog', // for example - 'Ivan Ganev'
    authorDescription: 'Arquitectura | Desarrollo de software | DevSecOps | Cloud Native', // short text about the author
    avatar: '/avatar.jpg',
    twitterSite: '', // website account on twitter
    twitterCreator: '', // creator account on twitter
    social: [
      {
        icon: `at`,
        url: `#`,
      },
      {
        icon: `linkedin`,
        url: `https://linkedin.com/in/santiago-lozano-restrepo-a505b02b6`,
      },
      {
        icon: `github`,
        url: `https://github.com/lozan0`,
      },
    ],
  },
  plugins: [
    {
      resolve: 'gatsby-theme-chronoblog',
      options: {
        uiText: {
          // ui text fot translate
          feedShowMoreButton: 'Mostrar mas',
          feedSearchPlaceholder: 'Buscar',
          cardReadMoreButton: 'Leer mas →',
          allTagsButton: 'Todos los tags',
        },
        feedItems: {
          // global settings for feed items
          limit: 50,
          yearSeparator: true,
          yearSeparatorSkipFirst: true,
          contentTypes: {
            links: {
              beforeTitle: '⬈ ',
            },
          },
        },
        feedSearch: {
          symbol: '',
        },
      },
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Chronoblog Gatsby Theme`,
        short_name: `Chronoblog`,
        start_url: `/`,
        background_color: `#fff`,
        theme_color: `#3a5f7d`,
        display: `standalone`,
        icon: `src/assets/favicon.png`,
      },
    },
    {
      resolve: `gatsby-plugin-sitemap`,
    },
    {
      resolve: `gatsby-plugin-google-analytics`,
      options: {
        // replace "UA-XXXXXXXXX-X" with your own Tracking ID
        trackingId: 'UA-XXXXXXXXX-X',
      },
    },
    {
      resolve: `gatsby-plugin-disqus`,
      options: {
        // replace "chronoblog-hacker" with your own disqus shortname
        shortname: `chronoblog-hacker`,
      },
    },
  ],
};
