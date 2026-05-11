export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/next/index',
    'pages/me/index',
    'pages/upload/index',
    'pages/chat/index',
    'pages/result/index',
    'pages/share/index',
    'pages/letter/index',
    'pages/generating/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: 'NestAI',
    navigationBarTextStyle: 'black',
    navigationStyle: 'custom',
  },
  tabBar: {
    color: '#7a736a',
    selectedColor: '#d9a823',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: 'Grow',
        iconPath: './assets/tabbar/sprout.png',
        selectedIconPath: './assets/tabbar/sprout-active.png',
      },
      {
        pagePath: 'pages/next/index',
        text: 'Next',
        iconPath: './assets/tabbar/compass.png',
        selectedIconPath: './assets/tabbar/compass-active.png',
      },
      {
        pagePath: 'pages/me/index',
        text: 'Me',
        iconPath: './assets/tabbar/user.png',
        selectedIconPath: './assets/tabbar/user-active.png',
      },
    ],
  },
})
