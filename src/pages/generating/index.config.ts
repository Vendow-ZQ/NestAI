export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '生成中',
      navigationStyle: 'custom',
    })
  : {
      navigationBarTitleText: '生成中',
      navigationStyle: 'custom',
    }
