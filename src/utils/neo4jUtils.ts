import neo4j from 'neo4j-driver';

let driver: neo4j.Driver;

export const initializeNeo4j = () => {
  driver = neo4j.driver(
    'neo4j+s://dc269e6a.databases.neo4j.io',
    neo4j.auth.basic('neo4j', 'D__Zcpk83Lk6YRKNWbz_pFCaT-cVSVyw21_KWwTftt0')
  );
};

export const createKnowledgeGraph = async (question: string, answer: string) => {
  const session = driver.session();

  try {
    await session.run(
      `
      MERGE (q:Question {text: $question})
      MERGE (a:Answer {text: $answer})
      MERGE (q)-[:HAS_ANSWER]->(a)
      `,
      { question, answer }
    );
  } finally {
    await session.close();
  }
};

export const getRelevantKnowledge = async (query: string): Promise<string> => {
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (q:Question)
      WITH q, apoc.text.levenshteinSimilarity(q.text, $query) AS similarity
      ORDER BY similarity DESC
      LIMIT 3
      MATCH (q)-[:HAS_ANSWER]->(a:Answer)
      RETURN q.text AS question, a.text AS answer
      `,
      { query }
    );

    const relevantKnowledge = result.records.map(record => {
      return `Q: ${record.get('question')}\nA: ${record.get('answer')}`;
    }).join('\n\n');

    return relevantKnowledge;
  } finally {
    await session.close();
  }
};

export const closeNeo4jConnection = () => {
  driver.close();
};