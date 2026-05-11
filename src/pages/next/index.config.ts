export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: 'Next',
      navigationStyle: 'custom',
    })
  : {
      navigationBarTitleText: 'Next',
      navigationStyle: 'custom',
    }
