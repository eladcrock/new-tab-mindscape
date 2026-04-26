DELETE FROM conversations c
WHERE (SELECT count(*) FROM messages m WHERE m.conversation_id = c.id) <= 1
  AND (c.title IS NULL OR c.title = 'New conversation')
  AND c.summary IS NULL;