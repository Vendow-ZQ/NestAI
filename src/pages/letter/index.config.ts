export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '一封信',
      navigationStyle: 'custom',
    })
  : {
      navigationBarTitleText: '一封信',
      navigationStyle: 'custom',
    }
