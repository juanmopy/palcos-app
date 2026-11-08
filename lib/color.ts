export function getContrastingTextColor(background: string) {
  const hex = background.replace("#", "");
  if (!/^[\da-f]{6}$/i.test(hex)) {
    return "#fff";
  }

  const channels = [0, 2, 4].map(
    (index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255,
  );
  const luminance = channels
    .map((channel) =>
      channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    )
    .reduce(
      (sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index],
      0,
    );

  return luminance > 0.179 ? "#0f172a" : "#fff";
}
