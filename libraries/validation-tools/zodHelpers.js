const { z } = require('zod')
const mongodb = require('mongodb')

const { ObjectId } = mongodb

/**
 * @import { DatetimeSchemaOptions } from './types'
 */

/**
 * @param {DatetimeSchemaOptions} options
 */
const datetimeSchema = ({ allowNull, allowUndefined, ...zodOptions } = {}) => {
  const union = [z.date(), z.iso.datetime(zodOptions)]
  if (allowNull) union.push(z.null())
  if (allowUndefined) union.push(z.undefined())
  return z.union(union).transform(dt => {
    if (allowNull && !dt) return dt === null ? null : undefined
    return dt instanceof Date ? dt : new Date(dt)
  })
}

const zz = {
  objectId: () =>
    z.string().refine(ObjectId.isValid, { message: 'invalid Mongo ObjectId' }),
  coercedObjectId: () =>
    z
      .string()
      .refine(ObjectId.isValid, { message: 'invalid Mongo ObjectId' })
      .transform(val => new ObjectId(val)),
  hex: () => z.string().regex(/^[0-9a-f]*$/),
  datetime: options => datetimeSchema(options),
  datetimeNullable: options => datetimeSchema({ ...options, allowNull: true }),
  datetimeNullish: options =>
    datetimeSchema({ ...options, allowNull: true, allowUndefined: true }),
  buildId: () =>
    z.string().regex(/^[0-9a-f]+-[0-9a-f]+$/, { message: 'invalid buildId' }),
  editorBuildId: () =>
    z.string().regex(/^[a-f0-9-]{36}-[0-9a-f]+-[0-9a-f]+$/, {
      message: 'invalid editorId-buildId',
    }),
  clsiServerId: () =>
    z.string().regex(/^[a-z0-9-]+$/, { message: 'invalid clsiServerId' }),
  compileBackendClass: () =>
    z
      .string()
      .regex(/^[a-z0-9-]+$/, { message: 'invalid compileBackendClass' }),
  compileGroup: () =>
    z.enum(['alpha', 'gvisor', 'standard', 'priority'], {
      message: 'invalid compileGroup',
    }),
  submissionId: () => z.string().regex(/^[a-zA-Z0-9_-]+$/),
  filepath: () =>
    z
      .string()
      .nonempty({ message: 'path is empty' })
      .refine(s => !s.startsWith('/'), { message: 'path is absolute' })
      .refine(s => !s.split('/').includes('..'), {
        message: 'path traversal detected',
      }),
}

module.exports = { zz }
