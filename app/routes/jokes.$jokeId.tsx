import {
  MetaFunction,
  isRouteErrorResponse,
  useLoaderData,
  useParams,
  useRouteError,
} from '@remix-run/react';
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
  redirect,
} from '@remix-run/node';

import { db } from '~/utils/db.server';
import { JokeDisplay } from '~/components/joke';
import { getUserId, requireUserId } from '~/utils/session.server';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const { description, title } = data
    ? {
        title: `${data.joke.name} joke`,
        description: `Enjoy the ${data.joke.name} joke and much more`,
      }
    : { title: 'No joke', description: 'No joke found' };

  return [
    { name: 'description', content: description },
    { name: 'twitter:description', content: description },
    { title },
  ];
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const userId = await getUserId(request);
  const joke = await db.joke.findUnique({
    where: { id: params.jokeId },
  });

  if (!joke) {
    throw new Response('What a joke! Not found.', { status: 404 });
  }

  return json({ isOwner: userId === joke.jokesterId, joke });
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const form = await request.formData();
  if (form.get('intent') !== 'delete') {
    throw new Response(`The intent ${form.get('intent')} is not supported`, {
      status: 400,
    });
  }
  const userId = await requireUserId(request);
  const joke = await db.joke.findUnique({ where: { id: params.jokeId } });

  if (!joke) {
    throw new Response("Can't delete what does not exist", { status: 404 });
  }

  if (joke.jokesterId !== userId) {
    throw new Response("Pssh, nice try. That's not your joke", { status: 403 });
  }

  await db.joke.delete({ where: { id: params.jokeId } });
  return redirect('/jokes');
};

export default function JokeRoute() {
  const data = useLoaderData<typeof loader>();

  return <JokeDisplay {...data} />;
}

export function ErrorBoundary() {
  const { jokeId } = useParams();
  const error = useRouteError();
  console.log(error);

  if (isRouteErrorResponse(error)) {
    if (error.status === 400) {
      return (
        <div className="error-container">
          What you&apos;re trying to do is not allowed.
        </div>
      );
    }
    if (error.status === 403) {
      return (
        <div className="error-container">
          Sorry, but {jokeId} is not your joke.
        </div>
      );
    }
    if (error.status === 404) {
      return (
        <div className="error-container">Huh? What the heck is {jokeId}?</div>
      );
    }
  }

  return (
    <div className="error-container">
      There was an error loading joke by the id {jokeId}. Sorry
    </div>
  );
}
