export const onRequestPost: PagesFunction = async () => Response.json({ error: 'Tool setup is available only in the private local workspace.' }, { status: 405 })
