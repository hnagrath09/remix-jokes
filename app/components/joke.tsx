import { Joke } from '@prisma/client';
import { Form, Link, useSearchParams } from '@remix-run/react';

export function JokeDisplay({
  canDelete = true,
  isOwner,
  joke,
}: {
  canDelete?: boolean;
  isOwner: boolean;
  joke: Pick<Joke, 'content' | 'name'>;
}) {
  const [searchParams] = useSearchParams();

  return (
    <div>
      <p>Here&apos;s your hilarious joke:</p>
      <p>{joke.content}</p>
      <Link to={`.?${searchParams}`}>{joke.name} Permalink</Link>
      {isOwner ? (
        <Form method="post">
          <button
            className="button"
            name="intent"
            type="submit"
            value="delete"
            disabled={!canDelete}
          >
            Delete
          </button>
        </Form>
      ) : null}
    </div>
  );
}
