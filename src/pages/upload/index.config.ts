export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '上传空间',
      navigationStyle: 'custom',
    })
  : {
      navigationBarTitleText: '上传空间',
      navigationStyle: 'custom',
    }
