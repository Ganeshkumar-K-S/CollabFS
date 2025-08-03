db.createCollection(
  "user",
  {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["_id", "name", "pwd", "email", "createAt", "lastAccessed","storageUsed"],
        properties: {
          _id: {
            bsonType: "string",
            description: "id must be of type string"
          },
          name: {
            bsonType: "string",
            description: "name must be of type string"
          },
          pwd: {
            bsonType: "string",
            description: "password must be of type string"
          },
          email : {
            bsonType: "string",
            description : "email must be of type string"
          },
          createAt: {
            bsonType: "date",
            description: "createAt must be of type date"
          },
          lastAccessed: {
            bsonType: "date",
            description: "lastAccessed must be of type date"
          },
          storageUsed: {
            bsonType:"long",
            description: "must be a long integer"
          }
        }
      }
    },
    validationLevel: "strict",
    validationAction: "error"
  }
);
