import mongoose from '../../../../../app/src/infrastructure/Mongoose.mjs'

const { Schema } = mongoose
const { ObjectId } = Schema

export const TemplateSchema = new Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String },
    descriptionMD: { type: String },
    author: { type: String },
    authorMD: { type: String },
    license: { type: String, required: true },
    mainFile: { type: String, required: true },
    compiler: { type: String, required: true },
    imageName: { type: String },
    language: { type: String },
    version: { type: Number, default: 1, required: true },
    owner: { type: ObjectId, ref: 'User' },
    project_id: { type: ObjectId, ref: 'Project' },
    lastUpdated: {
      type: Date,
      default() {
        return new Date()
      },
    required: true
    },
  },
  { minimize: false }
)

export const Template = mongoose.model('Template', TemplateSchema)
