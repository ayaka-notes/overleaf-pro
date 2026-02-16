import fs from 'fs'
function readFilesContentFromEnv(envVar) {
// envVar is either a file name: 'file.pem', or string with array: '["file.pem", "file2.pem"]'
  if (!envVar) return undefined
  try {
    const parsedFileNames = JSON.parse(envVar)
    return parsedFileNames.map(filename => fs.readFileSync(filename, 'utf8'))
  } catch (error) {
    if (error instanceof SyntaxError) { // failed to parse, envVar must be a file name
      return fs.readFileSync(envVar, 'utf8')
    } else {
      throw error
    }
  }
}
function numFromEnv(env) {
  return env ? Number(env) : undefined
}
function boolFromEnv(env) {
  if (env === undefined || env === null) return undefined
  if (typeof env === "string") {
    const envLower = env.toLowerCase()
    if (envLower === 'true') return true
    if (envLower === 'false') return false
  }
  throw new Error("Invalid value for boolean envirionment variable")
}

function splitFullName(fullName) {
  fullName = fullName.trim();
  let lastSpaceIndex = fullName.lastIndexOf(' ');
  let firstNames = fullName.substring(0, lastSpaceIndex).trim();
  let lastName = fullName.substring(lastSpaceIndex + 1).trim();
  return [firstNames, lastName];
}

export {
  readFilesContentFromEnv,
  numFromEnv,
  boolFromEnv,
  splitFullName,
}
