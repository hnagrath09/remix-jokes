import { json } from '@remix-run/node';
import type { ChangeEvent } from 'react';
import { matchSorter } from 'match-sorter';
import {
  Form,
  Link,
  Outlet,
  useLoaderData,
  useSearchParams,
} from '@remix-run/react';
import type { LinksFunction, LoaderFunctionArgs } from '@remix-run/node';

import { db } from '~/utils/db.server';
import stylesUrl from '~/styles/jokes.css?url';
import { getUser } from '~/utils/session.server';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: stylesUrl },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const users = await db.user.findMany();
  const user = await getUser(request);
  const userId = new URL(request.url).searchParams.get('userId');
  const search = new URL(request.url).searchParams.get('search') ?? '';

  const jokeListItems = await db.joke.findMany({
    where: { jokesterId: userId ?? undefined },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, content: true },
  });

  return json({
    jokeListItems: matchSorter(jokeListItems, search, {
      keys: ['name', 'content'],
    }).slice(0, 5),
    currentUser: user,
    users,
  });
};

export default function JokesRoute() {
  const data = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  function handleUserSelect(e: ChangeEvent<HTMLSelectElement>) {
    const selectedOption = e.target.value;
    const params = new URLSearchParams();
    if (selectedOption !== 'all') {
      params.set('userId', e.target.value);
      setSearchParams((prev) => {
        prev.set('userId', selectedOption);
        return prev;
      });
    } else {
      setSearchParams(params);
    }
  }

  function handleSearch(e: ChangeEvent<HTMLInputElement>) {
    const text = e.target.value;
    setSearchParams((prev) => {
      if (!text) {
        prev.delete('search');
      } else {
        prev.set('search', text);
      }
      return prev;
    });
  }

  return (
    <div className="jokes-layout">
      <header className="jokes-header">
        <div className="container">
          <h1 className="home-link">
            <Link to="/" title="Remix Jokes" aria-label="Remix Jokes">
              <span className="logo">🤪</span>
              <span className="logo-medium">J🤪KES</span>
            </Link>
          </h1>

          <div className="search-input">
            <input
              type="search"
              onChange={handleSearch}
              placeholder="Search jokes..."
              value={searchParams.get('search') ?? ''}
            />
          </div>

          {data.currentUser ? (
            <div className="user-info">
              <span>Hi {data.currentUser.username}</span>
              <Form action="/logout" method="post">
                <button type="submit" className="button">
                  Logout
                </button>
              </Form>
            </div>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </div>
      </header>

      <main className="jokes-main">
        <div className="container">
          <div className="jokes-list">
            <label htmlFor="user">Select User:</label>
            <select
              id="user"
              onChange={handleUserSelect}
              value={searchParams.get('userId') ?? 'all'}
            >
              <option value="all">All</option>
              {data.users.map(({ id, username }) => (
                <option key={id} value={id}>
                  {username}
                </option>
              ))}
            </select>

            <p>Here are a few more jokes to check out:</p>
            <ul>
              {data.jokeListItems.map(({ id, name }) => (
                <li key={id}>
                  <Link prefetch="intent" to={`${id}?${searchParams}`}>
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
            <Link to={`new?${searchParams}`} className="button">
              Add your own
            </Link>
          </div>
          <div className="jokes-outlet">
            <Outlet />
          </div>
        </div>
      </main>
      <footer className="jokes-footer">
        <div className="container">
          <Link reloadDocument to="/jokes.rss">
            RSS
          </Link>
        </div>
      </footer>
    </div>
  );
}
