import { fireEvent, render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { beforeEach, beforeAll, afterAll, describe, it, expect } from 'vitest';

import { FetchComponent } from '.';

const MOCK_TODO_RESPONSE = {
  userId: 1,
  id: 1,
  title: 'delectus aut autem',
  completed: false,
};

//책에서의 msw 버전은 "^0.47.4",
//현재는  "msw": "^2.2.13"이기 때문에
//코드를 수정함
//메서드들이 많이 바뀜
const server = setupServer(
  http.get('/todos/:id', ({ params }) => {
    const todoId = params.id;

    if (Number(todoId)) {
      return new HttpResponse(
        JSON.stringify({ ...MOCK_TODO_RESPONSE, id: Number(todoId) }),
      );
    } else {
      return new HttpResponse(null, { status: 404 });
    }
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  render(<FetchComponent />);
});

describe('FetchComponent 테스트', () => {
  it('데이터를 불러오기 전에는 기본 문구가 뜬다.', async () => {
    const nowLoading = screen.getByText(/불러온 데이터가 없습니다./);
    expect(nowLoading).toBeInTheDocument();
  });

  it('버튼을 클릭하면 데이터를 불러온다.', async () => {
    const button = screen.getByRole('button', { name: /1번/ });
    fireEvent.click(button);

    const data = await screen.findByText(MOCK_TODO_RESPONSE.title);
    expect(data).toBeInTheDocument();
  });

  it('버튼을 클릭하고 서버요청에서 에러가 발생하면 에러문구를 노출한다.', async () => {
    server.use(
      http.get('/todos/:id', () => {
        return new HttpResponse(null, { status: 503 });
      }),
    );

    const button = screen.getByRole('button', { name: /1번/ });
    fireEvent.click(button);

    const error = await screen.findByText(/에러가 발생했습니다/);
    expect(error).toBeInTheDocument();
  });
});
