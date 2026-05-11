export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '新变化',
      navigationStyle: 'custom',
    })
  : {
      navigationBarTitleText: '新变化',
      navigationStyle: 'custom',
    }
