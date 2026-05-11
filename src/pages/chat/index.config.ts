export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: 'Lifestyle Chat',
      navigationStyle: 'custom',
    })
  : {
      navigationBarTitleText: 'Lifestyle Chat',
      navigationStyle: 'custom',
    }
