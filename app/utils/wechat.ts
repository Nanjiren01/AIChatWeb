export function isInWechat(): boolean {
  const agent = navigator.userAgent.toLowerCase();
  return agent.indexOf("micromessenger") != -1;
}
