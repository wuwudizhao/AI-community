import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCommentDto } from './comments.dto';

describe('CreateCommentDto', () => {
  it.each(['', '   ', '\u200b\u200d\ufeff'])(
    'rejects content without visible characters',
    async (content) => {
      expect(await validate(plainToInstance(CreateCommentDto, { content }))).not.toHaveLength(0);
    },
  );

  it('trims valid plain text and enforces the 5,000 character limit', async () => {
    const valid = plainToInstance(CreateCommentDto, { content: '  hello  ' });
    expect(await validate(valid)).toHaveLength(0);
    expect(valid.content).toBe('hello');
    expect(
      await validate(plainToInstance(CreateCommentDto, { content: 'x'.repeat(5001) })),
    ).not.toHaveLength(0);
  });
});
