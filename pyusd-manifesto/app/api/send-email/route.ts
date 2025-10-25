import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, type } = await request.json()

    // Create transporter with Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    })

    // Send email
    await transporter.sendMail({
      from: `Mail-Fi PYUSD <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Email send error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
