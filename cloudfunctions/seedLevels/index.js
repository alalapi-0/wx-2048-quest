// R1 占位：R6 将写入默认关卡 seeds 到数据库
exports.main = async (event, context) => {
  return { ok: true, note: "R6 将写入 levels 种子数据" };
};
