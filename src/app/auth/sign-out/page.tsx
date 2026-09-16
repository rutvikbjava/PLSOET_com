/**
 * Sign Out Page
 * 
 * Triggers sign-out action immediately
 */

import { signOut } from '../actions';

export default async function SignOutPage() {
  await signOut();
  
  // Note: signOut() redirects, so this return is never reached
  return null;
}
