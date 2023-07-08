import { OpenAI } from "langchain/llms/openai";
import { SqlDatabase } from "langchain/sql_db";
import { createSqlAgent, SqlToolkit } from "langchain/agents";
import { PromptTemplate } from "langchain/prompts";
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

  /*
 const { PromptTemplate } = require('langchain');

// Define the template string
const template = "You are a JavaScript developer. Write a function that {task}.";

// Create the prompt template
const promptTemplate = new PromptTemplate(template);

// Format the prompt template with input variables
const formattedPrompt = promptTemplate.format({ task: "calculates the factorial of a number" });

console.log(formattedPrompt);
 */

  /*
https://walkingtree.tech/natural-language-to-query-your-sql-database-using-langchain-powered-by-llms/

_DEFAULT_TEMPLATE = """Given an input question, first create a syntactically correct {dialect} query to run, then look at the results of the query and return the answer.
Use the following format:
 
 
Question: "Question here"
SQLQuery: "SQL Query to run"
SQLResult: "Result of the SQLQuery"
Answer: "Final answer here"
 
 
Only use the following tables:
 
 
{table_info}
 
 
Use the table authors with author_id as primary key to get the list of authors and the table blogs with blog_id as the primary key to get the list of blogs and join the two tables on author_id.
 
 
Question: {input}"""
PROMPT = PromptTemplate(
    input_variables=["input", "table_info", "dialect"], template=_DEFAULT_TEMPLATE
)  
  */

  // const input = "What are the names of the children";
  // const input = "What media items include children?";

  //   What is a good name for a company that makes {product}?

  const xtemplate = `
  Given an input question, first create a syntactically correct saqlite query to run, then look at the results of the query and return the answer.
  Only include unique results.
  The answer should not include media items that don't exist in the mediaItems table.
  Do not make up answers.
  Use the following format:
  
  Question: Question here
  SQLite: SQLite Query to run
  SQLiteResult: Result of the SQLite Query
  Answer: Final answer here
  
  What media items include children?
  `;
  // const promptA = new PromptTemplate({ template: xtemplate, inputVariables: ["query"] });

  // We can use the `format` method to format the template with the given input values.
  // const responseA = await promptA.format({ query: "What media items include children?" });
  // console.log({ responseA });

//   return;

//   const template = `
// Given an input question, first create a syntactically correct saqlite query to run, then look at the results of the query and return the answer.
// Only include unique results.
// The answer should not include media items that don't exist in the mediaItems table.
// Do not make up answers.
// Use the following format:

// Question: Question here
// SQLite: SQLite Query to run
// SQLiteResult: Result of the SQLite Query
// Answer: Final answer here

// {input}
// `;

//   const query = "What media items include children?";
//   const prompt = new PromptTemplate({ template, inputVariables: ['input'] });
//   const formattedPrompt = await prompt.format({ input: query });
  const result = await executor.call({ xtemplate });

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

