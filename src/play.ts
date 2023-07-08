import { OpenAI } from "langchain/llms/openai";
import { SqlDatabase } from "langchain/sql_db";
import { createSqlAgent, SqlToolkit } from "langchain/agents";
import { DataSource } from "typeorm";

/** This example uses Chinook database, which is a sample database available for SQL Server, Oracle, MySQL, etc.
 * To set it up follow the instructions on https://database.guide/2-sample-databases-sqlite/, placing the .db file
 * in the examples folder.
 */
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
  const input = "What media items include Sam?";

  const query = `
Given an input question, first create a syntactically correct saqlite query to run, then look at the results of the query and return the answer.
Use the following format:

Question: Question here
SQLite: SQLite Query to run
SQLiteResult: Result of the SQLite Query
Answer: Final answer here

{input}
`
  // console.log(`Executing with input "${input}"...`);

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