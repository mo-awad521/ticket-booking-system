import { Test, TestingModule } from '@nestjs/testing';
import { TicketTypesService } from './ticket-types.service';

describe('TicketTypesService', () => {
  let service: TicketTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TicketTypesService],
    }).compile();

    service = module.get<TicketTypesService>(TicketTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
