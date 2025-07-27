db.createCollection(
  "user",
  {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["_id", "name", "pwd", "createAt", "lastAccessed"],
        properties: {
          _id: {
            bsonType: "objectId",
            description: "id must be of type objectId"
          },
          name: {
            bsonType: "string",
            description: "name must be of type string"
          },
          pwd: {
            bsonType: "string",
            description: "password must be of type string"
          },
          createAt: {
            bsonType: "date",
            description: "createAt must be of type date"
          },
          lastAccessed: {
            bsonType: "date",
            description: "lastAccessed must be of type date"
          }
        }
      }
    },
    validationLevel: "strict",
    validationAction: "error"
  }
);
