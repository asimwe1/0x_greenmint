// Node.js script to generate OpenAPI JSON for all contracts
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = path.join(__dirname, '../artifacts/contracts');
const OUTPUT_FILE = path.join(__dirname, '../openapi.json');

function getAllArtifactFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllArtifactFiles(filePath));
    } else if (file.endsWith('.json') && !file.endsWith('.dbg.json')) {
      results.push(filePath);
    }
  });
  return results;
}

function abiTypeToOpenApiType(type) {
  if (type.startsWith('uint') || type.startsWith('int')) return 'integer';
  if (type === 'address' || type === 'string' || type === 'bytes') return 'string';
  if (type === 'bool') return 'boolean';
  if (type.endsWith('[]')) return 'array';
  return 'string';
}

function abiInputsToParameters(inputs) {
  return inputs.map(input => ({
    name: input.name,
    in: 'query',
    required: true,
    schema: { type: abiTypeToOpenApiType(input.type) },
    description: input.internalType || input.type
  }));
}

function abiOutputsToSchema(outputs) {
  if (!outputs || outputs.length === 0) return { type: 'string' };
  if (outputs.length === 1) {
    return { type: abiTypeToOpenApiType(outputs[0].type) };
  }
  return {
    type: 'object',
    properties: outputs.reduce((acc, output, idx) => {
      acc[output.name || `output${idx}`] = { type: abiTypeToOpenApiType(output.type) };
      return acc;
    }, {})
  };
}

function abiEventToOpenApi(event) {
  return {
    summary: `Event: ${event.name}`,
    description: `Emitted when ${event.name} occurs.`,
    parameters: abiInputsToParameters(event.inputs),
  };
}

function abiErrorToOpenApi(error) {
  return {
    summary: `Error: ${error.name}`,
    description: `Error ${error.name}`,
    parameters: abiInputsToParameters(error.inputs),
  };
}

function generateOpenApiForContract(contractName, abi) {
  const paths = {};
  abi.forEach(item => {
    if (item.type === 'function') {
      const pathKey = `/${contractName}/${item.name}`;
      paths[pathKey] = {
        post: {
          summary: `Call ${item.name} on ${contractName}`,
          description: item.stateMutability ? `State mutability: ${item.stateMutability}` : '',
          parameters: abiInputsToParameters(item.inputs),
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: abiOutputsToSchema(item.outputs)
                }
              }
            }
          }
        }
      };
    }
  });
  // Add events and errors as tags
  const events = abi.filter(item => item.type === 'event').map(abiEventToOpenApi);
  const errors = abi.filter(item => item.type === 'error').map(abiErrorToOpenApi);
  return { paths, events, errors };
}

function main() {
  const artifactFiles = getAllArtifactFiles(ARTIFACTS_DIR);
  const openApi = {
    openapi: '3.0.0',
    info: {
      title: 'Smart Contracts API',
      version: '1.0.0',
      description: 'Auto-generated OpenAPI documentation for Solidity contracts.'
    },
    paths: {},
    tags: [],
    components: {},
    x_events: {},
    x_errors: {}
  };
  artifactFiles.forEach(file => {
    const artifact = JSON.parse(fs.readFileSync(file, 'utf8'));
    const contractName = artifact.contractName;
    const { paths, events, errors } = generateOpenApiForContract(contractName, artifact.abi);
    Object.assign(openApi.paths, paths);
    if (events.length > 0) openApi.x_events[contractName] = events;
    if (errors.length > 0) openApi.x_errors[contractName] = errors;
    openApi.tags.push({ name: contractName });
  });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(openApi, null, 2));
  console.log('OpenAPI JSON generated at', OUTPUT_FILE);
}

main(); 