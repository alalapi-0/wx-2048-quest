Page({
  data: {},
  onLoad() {
    console.log("Home loaded (R1)");
  },
  goGame() {
    wx.navigateTo({ url: "/pages/game/game" });
  }
});
