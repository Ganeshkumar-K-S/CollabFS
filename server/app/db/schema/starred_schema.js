db.createCollection("starred", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["groupId", "userId"],
      properties: {
        groupId: {
          bsonType: "string",
          description: "must be a string and is required"
        },
        userId: {
          bsonType: "string",
          description: "must be a string and is required"
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
})
