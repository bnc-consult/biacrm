import 'dotenv/config';
import { query } from '../src/database/connection';

const email = process.env.EMAIL?.trim().toLowerCase();
const role = process.env.ROLE?.trim().toLowerCase();

if (!email || !role) {
  console.error('Use EMAIL e ROLE para executar este script.');
  process.exit(1);
}

const run = async () => {
  const update = await query('UPDATE users SET role = $1 WHERE lower(email) = $2', [role, email]);
  const updated = update?.rowCount ?? update?.changes ?? 0;
  const result = await query(
    'SELECT id, email, role, company_id FROM users WHERE lower(email) = $1 LIMIT 1',
    [email]
  );
  const row = result.rows?.[0];

  console.log({ updated, user: row || null });
};

run().catch((error) => {
  console.error('Erro ao atualizar usuário:', error);
  process.exit(1);
});
