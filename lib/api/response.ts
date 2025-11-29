import { NextResponse } from "next/server";

export function successResponse() {
  return NextResponse.json({ success: true });
}

export function errorResponse( message: string, status: number = 500 ) {
  return NextResponse.json( { error: message }, { status } );
}