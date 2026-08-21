import {
  resolveAssignedToLabel,
  resolveResponsibleLabel,
} from './owner-assignment.util';

describe('owner-assignment.util', () => {
  it('resolveAssignedToLabel prefers name then email', () => {
    expect(resolveAssignedToLabel({ name: ' Ana ', email: 'a@b.com' })).toBe(
      'Ana',
    );
    expect(resolveAssignedToLabel({ email: 'a@b.com', id: 'u1' })).toBe(
      'a@b.com',
    );
  });

  it('resolveResponsibleLabel uses owner before legacy assignedTo', () => {
    expect(resolveResponsibleLabel({ name: 'Owner' }, 'Legacy Name')).toBe(
      'Owner',
    );
    expect(resolveResponsibleLabel(null, ' Legacy ')).toBe('Legacy');
    expect(resolveResponsibleLabel(null, null)).toBeNull();
  });
});
