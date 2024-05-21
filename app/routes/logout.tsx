import { type ActionFunctionArgs, redirect } from '@remix-run/node';
import { logout } from '~/utils/session.server';

export const action = async ({ request }: ActionFunctionArgs) =>
  logout(request);

export const loader = async () => redirect('/');
