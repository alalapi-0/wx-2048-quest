Page({
  data: {},
  onLoad() {
    console.log("Game placeholder (R1)");
  },
  goResult() {
    wx.navigateTo({ url: "/pages/result/result" });
  }
});
