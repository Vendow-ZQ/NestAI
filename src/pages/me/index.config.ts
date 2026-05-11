export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: 'Me',
      navigationStyle: 'custom',
    })
  : {
      navigationBarTitleText: 'Me',
      navigationStyle: 'custom',
    }
