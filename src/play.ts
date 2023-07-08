import { OpenAI } from "langchain/llms/openai";
import { SqlDatabase } from "langchain/sql_db";
import { createSqlAgent, SqlToolkit } from "langchain/agents";
import { DataSource } from "typeorm";

export const run = async () => {
  const datasource = new DataSource({
    type: "sqlite",
    database: "/Users/tedshaffer/Documents/Projects/ai/photo-0/photo0.db",
  });
  const db = await SqlDatabase.fromDataSourceParams({
    appDataSource: datasource,
  });
  const model = new OpenAI({ temperature: 0 });
  const toolkit = new SqlToolkit(db, model);
  const executor = createSqlAgent(model, toolkit);

  // const input = "What are the names of the children";
  // const input = "What media items include Sam?";

  // What media items do not include any children?

  // What media items include pizza?
  // What media items include pizza but no children?
  // What media items include pizza and Sam?

  // What media items include pizza and Sam but not Rachel? ** failed to exclude Rachel
  // SELECT mediaItems.fileName FROM mediaItems INNER JOIN foodMediaItemAssociations ON mediaItems.id = foodMediaItemAssociations.mediaItemId INNER JOIN food ON food.id = foodMediaItemAssociations.foodId INNER JOIN childMediaItemAssociations ON mediaItems.id = childMediaItemAssociations.mediaItemId INNER JOIN children ON children.id = childMediaItemAssociations.childId WHERE food.name = 'pizza' AND children.name = 'Sam' AND children.name != 'Rachel';

  // What media items do not include Rachel? ** successful
  // SELECT fileName FROM mediaItems WHERE id NOT IN (SELECT mediaItemId FROM childMediaItemAssociations WHERE childId = (SELECT id FROM children WHERE name = 'Rachel'));

  // What media items include Joel but not Rachel? ** failed to exclude Rachel
  // SELECT mediaItems.fileName FROM mediaItems \nINNER JOIN childMediaItemAssociations ON mediaItems.id = childMediaItemAssociations.mediaItemId \nWHERE childMediaItemAssociations.childId = 2 AND childMediaItemAssociations.childId != 3


  // ChatGPT guidance
  /*
    SELECT p.photoId, p.photoName
    FROM childrenPhotosAssociation cpa
    JOIN children c1 ON cpa.childId = c1.childId AND c1.childName = 'childA'
    JOIN photos p ON cpa.photoId = p.photoId
    WHERE NOT EXISTS (
      SELECT 1
      FROM children c2
      JOIN childrenPhotosAssociation cpa2 ON c2.childId = cpa2.childId AND cpa2.photoId = p.photoId
      WHERE c2.childName = 'childB'
    );

    SELECT DISTINCT mediaItems.fileName
    FROM childMediaItemAssociations
    JOIN children on childMediaItemAssociations.mediaItemId = children.id AND children.name = 'Joel'
    JOIN mediaItems ON childMediaItemAssociations.mediaItemId = mediaItems.id
    WHERE NOT EXISTS (
      SELECT 1
      FROM children
      JOIN childMediaItemAssociations on children.id = childMediaItemAssociations.childId AND childMediaItemAssociations.mediaItemId = mediaItems.id
      WHERE children.name = 'Rachel'
    );
  */

  const input = `
Given an input question, first create a syntactically correct sqlite query to run, then look at the results of the query and return the answer.
Use the following format:

Question: Question here
SQLite: SQLite Query to run
SQLiteResult: Result of the SQLite Query
Answer: Final answer here

What media items include Joel but not Rachel?

Use the following query:
SELECT DISTINCT mediaItems.fileName
FROM childMediaItemAssociations
JOIN children on childMediaItemAssociations.mediaItemId = children.id AND children.name = 'Joel'
JOIN mediaItems ON childMediaItemAssociations.mediaItemId = mediaItems.id
WHERE NOT EXISTS (
  SELECT 1
  FROM children
  JOIN childMediaItemAssociations on children.id = childMediaItemAssociations.childId AND childMediaItemAssociations.mediaItemId = mediaItems.id
  WHERE children.name = 'Rachel'
);
`;

  const result = await executor.call({ input });

  console.log(`Got output ${result.output}`);

  console.log(
    `Got intermediate steps ${JSON.stringify(
      result.intermediateSteps,
      null,
      2
    )}`
  );

  await datasource.destroy();
};

// 4330774323964802