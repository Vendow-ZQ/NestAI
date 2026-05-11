export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '改造方案',
      navigationStyle: 'custom',
    })
  : {
      navigationBarTitleText: '改造方案',
      navigationStyle: 'custom',
    }
