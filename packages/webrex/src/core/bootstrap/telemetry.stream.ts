import { Subject } from 'rxjs';

// This is a pure stream of strings.
// It is low-level and can be imported anywhere without circular dependencies.
export const serverLogStream$ = new Subject<string>();
