const fs = require('fs');
const file = '/app/dist/config/swagger.js';
let code = fs.readFileSync(file, 'utf8');

const target = 'const swaggerSpec = (0, swagger_jsdoc_1.default)(options);';
const replacement = `const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
if (swaggerSpec && swaggerSpec.paths) {
  delete swaggerSpec.paths.openapi;
  delete swaggerSpec.paths.info;
}
swaggerSpec.servers = [
  { url: '/', description: 'Servidor Atual (AWS)' },
  { url: 'https://api.estudemy.com', description: 'Produção' }
];`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(file, code, 'utf8');
  console.log('SWAGGER_PATCH_SUCCESS');
} else if (code.includes('delete swaggerSpec.paths.openapi')) {
  console.log('SWAGGER_ALREADY_PATCHED');
} else {
  console.error('TARGET_NOT_FOUND');
  process.exit(1);
}

