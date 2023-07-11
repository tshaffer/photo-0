import { OpenAI } from "langchain/llms/openai";
import { SqlDatabase } from "langchain/sql_db";
import { createSqlAgent, SqlToolkit } from "langchain/agents";
import { DataSource } from "typeorm";

export const run = async () => {
  const datasource = new DataSource({
    type: "sqlite",
    database: "/Users/tedshaffer/Documents/Projects/ai/photo-0/photo1.db",
  });
  const db = await SqlDatabase.fromDataSourceParams({
    appDataSource: datasource,
  });
  const model = new OpenAI({ temperature: 0 });
  const toolkit = new SqlToolkit(db, model);
  const executor = createSqlAgent(model, toolkit);

  // Reference: https://blog.langchain.dev/llms-and-sql/

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

  //   const input = `
  // Given an input question, first create a syntactically correct sqlite query to run, then look at the results of the query and return the answer.
  // Use the following format:

  // Question: Question here
  // SQLite: SQLite Query to run
  // SQLiteResult: Result of the SQLite Query
  // Answer: Final answer here

  // What media items include Joel but not Rachel?

  // Use the following query:
  // SELECT DISTINCT mediaItems.fileName
  // FROM childMediaItemAssociations
  // JOIN children on childMediaItemAssociations.mediaItemId = children.id AND children.name = 'Joel'
  // JOIN mediaItems ON childMediaItemAssociations.mediaItemId = mediaItems.id
  // WHERE NOT EXISTS (
  //   SELECT 1
  //   FROM children
  //   JOIN childMediaItemAssociations on children.id = childMediaItemAssociations.childId AND childMediaItemAssociations.mediaItemId = mediaItems.id
  //   WHERE children.name = 'Rachel'
  // );
  // `;

  const input = `
    CREATE TABLE Images (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT    NOT NULL
                  UNIQUE
    )

    CREATE TABLE Tags (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      pid  INTEGER,
      name TEXT    NOT NULL,
      UNIQUE (
          name,
          pid
      )
    )

    CREATE TABLE TagsTree (
      id  INTEGER NOT NULL,
      pid INTEGER NOT NULL,
      UNIQUE (
          id,
          pid
      )
    )

    CREATE TABLE ImageTags (
      imageId INTEGER NOT NULL,
      tagId   INTEGER NOT NULL,
      UNIQUE (
          imageId,
          tagId
      )
    )

    select * from Images limit 2;
    id  name
    1   Sam.jpg
    2   Joel.jpg

    select * from Images
    id|name
1|Sam.jpg
2|Joel.jpg
3|Rachel.png
4|Ted.jpg
5|Lori.bmap
6|TedLori.jpg
7|LoriRachel.png
8|LoriSam.jpg
9|TedSamJoel.png
10|TedLoriJoelRachel.jpg
11|SamJoelRachel.jpg
12|JoelRachel.jpg
select * from Images;
1|Sam.jpg
2|Joel.jpg
3|Rachel.png
4|Ted.jpg
5|Lori.bmap
6|TedLori.jpg
7|LoriRachel.png
8|LoriSam.jpg
9|TedSamJoel.png
10|TedLoriJoelRachel.jpg
11|SamJoelRachel.jpg
12|JoelRachel.jpg

select * from Tags
id|pid|name
1|0|Shaffers
2|1|ShafferParents
3|1|ShafferChildren
4|2|Ted
5|2|Lori
6|3|Sam
7|3|Joel
8|3|Rachel

select * from TagsTree;
id|pid
4|0
4|1
4|2
5|0
5|1
5|2
6|0
6|1
6|3
7|0
7|1
7|3
8|0
8|1
8|3

select * from ImageTags
imageId|tagId
1|6
2|7
3|8
4|4
5|5
6|2
7|5
7|8
8|5
8|6
9|4
9|6
9|7
10|2
10|7
10|8
11|3
12|7
12|8

WITH RECURSIVE TagsTree AS (
     SELECT id FROM Tags WHERE id = 8
     UNION
     SELECT t.id
     FROM Tags t
     JOIN TagsTree th ON t.pid = th.id
   )
   SELECT i.id, i.name
   FROM Images i
   JOIN ImageTags it ON i.id = it.imageId
   JOIN TagsTree th ON it.tagId = th.id;
   
    Given an input question, first create a syntactically correct sqlite query to run, then look at the results of the query and return the answer.
    Use the following format:
  
    Question: Question here
    SQLite: SQLite Query to run
    SQLiteResult: Result of the SQLite Query
    Answer: Final answer here
  
    List the images that include Rachel.

  `;

  /*

SELECT Images.*
    FROM Images
    JOIN ImageTags ON Images.id = ImageTags.imageId
    JOIN Tags ON ImageTags.tagId = Tags.id
    JOIN Tags AS ParentTags ON Tags.pid = ParentTags.id
    WHERE Tags.name = 'Rachel' AND ParentTags.name = (
      SELECT Tags.name
      FROM Tags
      WHERE Tags.id = (
        SELECT Tags.pid
        FROM Tags
        WHERE Tags.name = 'Rachel'
      )
    );
id|name
3|Rachel.png
7|LoriRachel.png
10|TedLoriJoelRachel.jpg
12|JoelRachel.jpg


SELECT Images.*
   ...> FROM Images
   ...> JOIN ImageTags ON Images.id = ImageTags.imageId
   ...> JOIN Tags ON ImageTags.tagId = Tags.id
   ...> JOIN TagsTree ON Tags.id = TagsTree.id
   ...> JOIN Tags AS ParentTags ON TagsTree.pid = ParentTags.id
   ...> WHERE ParentTags.name = 'ShafferChildren' AND Tags.name = 'Rachel';
3|Rachel.png
7|LoriRachel.png
10|TedLoriJoelRachel.jpg
12|JoelRachel.jpg
  */
  
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