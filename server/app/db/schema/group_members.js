db.createCollection(
  "groupMembers",
  {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["userId", "groupId", "role", "joinedAt"],
        properties: {
          userId: {
            bsonType: "string",
            description: "userId must be a string"
          },
          groupId: {
            bsonType: "string",
            description: "groupId must be a string"
          },
          role: {
            bsonType: "string",
            description: "role must be a string"
          },
          joinedAt: {
            bsonType: "date",
            description: "joinedAt must be a date"
          }
        }
      }
    },
    validationLevel: "strict",
    validationAction: "error"
  }
);
