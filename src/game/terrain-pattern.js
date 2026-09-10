function coordinateHash(x, y) {
  let value = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return (value ^ (value >>> 16)) >>> 0;
}

const positiveModulo = (value, divisor) => ((value % divisor) + divisor) % divisor;

export function terrainSample(tile, globalX, globalY, now = 0) {
  const noise = coordinateHash(globalX, globalY);
  if (tile === 'grass') {
    const variant = noise % 23;
    return { char: variant === 0 ? "'" : variant < 5 ? ',' : '.', color: variant < 5 ? 'grass2' : 'grass' };
  }
  if (tile === 'sand') return { char: noise % 11 === 0 ? ':' : '.', color: 'sand' };
  if (tile === 'water') {
    const wave = positiveModulo(Math.floor(now / 115) + globalX + (noise % 5), 9);
    return { char: wave < 2 ? '-' : '~', color: wave < 2 ? 'foam' : 'water' };
  }
  return { char: ' ', color: 'void' };
}
