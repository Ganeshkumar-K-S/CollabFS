db.createCollection(
  "files",
  {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: [
          "name",
          "uploadedBy",
          "uploadedAt",
          "GridFSId",
          "size",
          "groupId",
          "pinned"
        ],
        properties: {
          name: {
            bsonType: "string",
            description: "Name of the uploaded file"
          },
          uploadedBy: {
            bsonType: "string",
            description: "User ID or name of the person who uploaded the file"
          },
          uploadedAt: {
            bsonType: "date",
            description: "Timestamp when the file was uploaded"
          },
          GridFSId: {
            bsonType: "objectId",
            description: "Reference ID to the actual file stored in GridFS"
          },
          size: {
            bsonType: "long",
            minimum: 0,
            description: "Size of the file in bytes (must be a positive integer)"
          },
          groupId: {
            bsonType: "string",
            description: "Reference ID to the group (or workspace/vault) this file belongs to"
          },
          pinned: {
            bsonType: "bool",
            description: "Boolean flag indicating if the file is pinned"
          }
        }
      }
    },
    validationLevel: "strict",
    validationAction: "error"
  }
);
