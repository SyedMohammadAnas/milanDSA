import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'
import type { PostgrestError } from '@supabase/supabase-js'
import puppeteer from 'puppeteer'

type StudentDatabaseRow = Database['public']['Tables']['student_database']['Row']

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] 🔐 LOGIN ATTEMPT STARTED`)

  try {
    const { email, password } = await request.json()
    console.log(`[${timestamp}] 📧 Email received: ${email}`)
    console.log(`[${timestamp}] 🔑 Password received: ${'*'.repeat(password.length)}`)

    if (!email || !password) {
      console.log(`[${timestamp}] ❌ VALIDATION FAILED: Missing email or password`)
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log(`[${timestamp}] 🗄️ CHECKING DATABASE FOR EXISTING STUDENT`)

    // First, check if student already exists in our database
    const { data: existingStudent, error: checkError } = await supabase
      .from('student_database')
      .select('*')
      .eq('email', email)
      .single<StudentDatabaseRow>()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error(`[${timestamp}] ❌ DATABASE ERROR:`, checkError)
      return NextResponse.json(
        { message: 'Database error occurred' },
        { status: 500 }
      )
    }

    if (existingStudent && existingStudent.email) {
      console.log(`[${timestamp}] ✅ STUDENT FOUND IN DATABASE: ${existingStudent.email}`)
      console.log(`[${timestamp}] 🔐 VERIFYING PASSWORD`)

      // Student exists, verify password
      if (existingStudent.password === password) {
        console.log(`[${timestamp}] ✅ PASSWORD VERIFIED - LOGIN SUCCESSFUL`)
        console.log(`[${timestamp}] 👤 Student: ${existingStudent.full_name} (${existingStudent.registration_number})`)

        return NextResponse.json({
          message: 'Login successful',
          student: {
            email: existingStudent.email,
            fullName: existingStudent.full_name,
            registrationNumber: existingStudent.registration_number,
            program: existingStudent.program,
            department: existingStudent.department,
            specialization: existingStudent.specialization,
            semester: existingStudent.semester,
            batch: existingStudent.batch
          }
        })
      } else {
        console.log(`[${timestamp}] ❌ PASSWORD VERIFICATION FAILED`)
        return NextResponse.json(
          { message: 'Invalid credentials' },
          { status: 401 }
        )
      }
    }

    console.log(`[${timestamp}] 🆕 STUDENT NOT FOUND IN DATABASE - INITIATING ACADEMIA SCRAPING`)

    // Student doesn't exist, validate against Academia portal
    try {
      console.log(`[${timestamp}] 🌐 CONNECTING TO ACADEMIA PORTAL`)
      const academiaResponse = await fetch('https://academia.srmist.edu.in/', {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })

      if (!academiaResponse.ok) {
        return NextResponse.json(
          { message: 'Unable to connect to Academia portal' },
          { status: 503 }
        )
      }

      // For now, we'll simulate the Academia login and data extraction
      // In a real implementation, you'd use a headless browser or scraping library
      const studentData = await scrapeAcademiaData(email, password)

      if (!studentData) {
        return NextResponse.json(
          { message: 'Invalid credentials' },
          { status: 401 }
        )
      }

      console.log(`[${timestamp}] 💾 SAVING STUDENT DATA TO DATABASE`)

      // Insert new student data into our database
      const insertData = {
        email,
        password,
        full_name: studentData.fullName,
        registration_number: studentData.registrationNumber,
        program: studentData.program,
        department: studentData.department,
        specialization: studentData.specialization,
        semester: studentData.semester,
        batch: studentData.batch
      }

      const query = supabase
        .from('student_database')
        // @ts-expect-error - TypeScript type inference issue with insert
        .insert(insertData)
        .select()
        .single()

      const { data: newStudent, error: insertError } = await query as { data: StudentDatabaseRow | null, error: PostgrestError | null }

      if (insertError || !newStudent) {
        console.error(`[${timestamp}] ❌ DATABASE INSERT ERROR:`, insertError)
        return NextResponse.json(
          { message: 'Failed to save student data' },
          { status: 500 }
        )
      }

      console.log(`[${timestamp}] ✅ STUDENT DATA SAVED SUCCESSFULLY`)
      console.log(`[${timestamp}] 🎉 LOGIN PROCESS COMPLETED SUCCESSFULLY`)

      return NextResponse.json({
        message: 'Login successful and student data saved',
        student: {
          email: newStudent.email,
          fullName: newStudent.full_name,
          registrationNumber: newStudent.registration_number,
          program: newStudent.program,
          department: newStudent.department,
          specialization: newStudent.specialization,
          semester: newStudent.semester,
          batch: newStudent.batch
        }
      })

    } catch (academiaError) {
      console.error(`[${timestamp}] ❌ ACADEMIA PORTAL ERROR:`, academiaError)
      return NextResponse.json(
        { message: 'Unable to verify credentials with Academia portal' },
        { status: 503 }
      )
    }

  } catch (error) {
    console.error(`[${timestamp}] ❌ UNEXPECTED LOGIN ERROR:`, error)
    return NextResponse.json(
      { message: 'An error occurred during login' },
      { status: 500 }
    )
  }
}

// Function to scrape Academia portal for student data
async function scrapeAcademiaData(email: string, password: string) {
  let browser
  try {
    console.log(`[${new Date().toISOString()}] 🚀 LAUNCHING PUPPETEER BROWSER`)

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    })

    const page = await browser.newPage()

    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

    // Set viewport
    await page.setViewport({ width: 1366, height: 768 })

    console.log(`[${new Date().toISOString()}] 🌐 NAVIGATING TO ACADEMIA PORTAL`)

    // Navigate to Academia login page
    await page.goto('https://academia.srmist.edu.in/', {
      waitUntil: 'networkidle0',
      timeout: 60000
    })

    console.log(`[${new Date().toISOString()}] 📄 PAGE LOADED, CURRENT URL: ${page.url()}`)

    // Wait a bit for any JavaScript to load
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Get page content for debugging
    const pageContent = await page.content()
    console.log(`[${new Date().toISOString()}] 📄 PAGE TITLE: ${await page.title()}`)
    console.log(`[${new Date().toISOString()}] 📄 PAGE CONTENT LENGTH: ${pageContent.length}`)

    // Take screenshot for debugging (save to public folder for easy access)
    try {
      await page.screenshot({ path: 'public/debug-screenshot.png', fullPage: true })
      console.log(`[${new Date().toISOString()}] 📸 DEBUG SCREENSHOT SAVED TO public/debug-screenshot.png`)
    } catch (screenshotError) {
      console.log(`[${new Date().toISOString()}] ⚠️ COULD NOT SAVE DEBUG SCREENSHOT:`, screenshotError instanceof Error ? screenshotError.message : String(screenshotError))
    }

    // Check if there's an iframe with the login form (Zoho Creator pattern)
    console.log(`[${new Date().toISOString()}] 🔍 LOOKING FOR LOGIN IFRAME`)

    let loginFrame
    try {
      // Wait for the iframe to load
      await page.waitForSelector('iframe#signinFrame, iframe.siginiframe, iframe[name="zohoiam"]', { timeout: 15000 })
      console.log(`[${new Date().toISOString()}] ✅ FOUND LOGIN IFRAME`)

      // Get the iframe element
      loginFrame = await page.$('iframe#signinFrame') || await page.$('iframe.siginiframe') || await page.$('iframe[name="zohoiam"]')

      if (!loginFrame) {
        console.log(`[${new Date().toISOString()}] ❌ COULD NOT ACCESS LOGIN IFRAME`)
        return null
      }

      console.log(`[${new Date().toISOString()}] 🔄 SWITCHING TO IFRAME CONTEXT`)
    } catch {
      console.log(`[${new Date().toISOString()}] ❌ NO IFRAME FOUND, LOOKING FOR DIRECT INPUTS`)

      // Fallback: look for inputs on the main page
      const inputSelectors = [
        'input[type="text"]',
        'input[type="email"]',
        'input[name*="email"]',
        'input[name*="user"]',
        'input[name*="username"]',
        'input[id*="email"]',
        'input[id*="user"]',
        'input[id*="username"]',
        '#username',
        '#user',
        '#email',
        '.username',
        '.user',
        '.email'
      ]

      let foundInput = false
      for (const selector of inputSelectors) {
        try {
          const element = await page.$(selector)
          if (element) {
            console.log(`[${new Date().toISOString()}] ✅ FOUND INPUT FIELD: ${selector}`)
            foundInput = true
            break
          }
        } catch {
          continue
        }
      }

      if (!foundInput) {
        console.log(`[${new Date().toISOString()}] ❌ NO INPUT FIELDS FOUND ANYWHERE`)
        return null
      }

      // If we found inputs on main page, continue with main page context
      loginFrame = null
    }

    // Wait for login form elements (either in iframe or main page)
    console.log(`[${new Date().toISOString()}] ⏳ WAITING FOR LOGIN FORM ELEMENTS`)
    const contextPage = loginFrame ? await loginFrame.contentFrame() : page

    if (!contextPage) {
      console.log(`[${new Date().toISOString()}] ❌ COULD NOT ACCESS IFRAME CONTENT`)
      return null
    }

    // Wait for form to load in the correct context
    console.log(`[${new Date().toISOString()}] 🔍 INSPECTING IFRAME CONTENT`)
    await contextPage.waitForSelector('input[type="text"], input[type="email"], input[name*="email"], input[name*="user"], input[name*="username"], input[id*="email"], input, button', { timeout: 20000 })

    // Debug: Log all input elements in the iframe
    const allInputs = await contextPage.$$eval('input', inputs =>
      inputs.map(input => ({
        type: input.type,
        name: input.name,
        id: input.id,
        className: input.className,
        placeholder: input.placeholder,
        disabled: input.disabled,
        visible: input.offsetWidth > 0 && input.offsetHeight > 0
      }))
    )
    console.log(`[${new Date().toISOString()}] 📋 ALL INPUT ELEMENTS IN IFRAME:`, allInputs)

    // Debug: Log all buttons in the iframe
    const allButtons = await contextPage.$$eval('button, input[type="submit"]', buttons =>
      buttons.map(button => ({
        tagName: button.tagName,
        type: button.type,
        text: button.textContent?.trim(),
        id: button.id,
        className: button.className,
        visible: button.offsetWidth > 0 && button.offsetHeight > 0
      }))
    )
    console.log(`[${new Date().toISOString()}] 📋 ALL BUTTON ELEMENTS IN IFRAME:`, allButtons)

    // Fill in email with comprehensive selectors including Zoho specific ones
    console.log(`[${new Date().toISOString()}] ✍️ STEP 1: FILLING EMAIL/LOGIN FIELD`)

    // Based on the debug output, the login field is: name="LOGIN_ID", id="login_id", type="text"
    const loginFieldSelectors = [
      'input[name="LOGIN_ID"]',
      '#login_id',
      'input[type="text"]',
      'input[placeholder*="Email"]'
    ]

    let loginFilled = false
    for (const selector of loginFieldSelectors) {
      try {
        const element = await contextPage.$(selector)
        if (element) {
          // Check if element is visible and enabled
          const isVisible = await contextPage.evaluate(el => {
            const htmlEl = el as HTMLElement
            const disabled = 'disabled' in htmlEl ? (htmlEl as HTMLInputElement).disabled : false
            return htmlEl.offsetWidth > 0 && htmlEl.offsetHeight > 0 && !disabled
          }, element)

          if (!isVisible) {
            console.log(`[${new Date().toISOString()}] ⚠️ LOGIN FIELD NOT VISIBLE: ${selector}`)
            continue
          }

          // Clear the field by selecting all and deleting
          await element.click({ clickCount: 3 }) // Select all text
          await element.type('', { delay: 50 }) // Clear
          await element.type(email, { delay: 100 })

          console.log(`[${new Date().toISOString()}] ✅ LOGIN FIELD FILLED USING: ${selector}`)
          loginFilled = true
          break
        }
      } catch (e) {
        console.log(`[${new Date().toISOString()}] ⚠️ ERROR WITH LOGIN SELECTOR ${selector}:`, e instanceof Error ? e instanceof Error ? e.message : String(e) : String(e))
        continue
      }
    }

    if (!loginFilled) {
      console.log(`[${new Date().toISOString()}] ❌ COULD NOT FILL LOGIN FIELD`)
      return null
    }

    // Click the "Next" button to proceed to password field
    console.log(`[${new Date().toISOString()}] 🖱️ STEP 2: CLICKING NEXT BUTTON`)

    const nextButtonSelectors = [
      '#nextbtn',
      'button[id="nextbtn"]',
      'button:has-text("Next")',
      'button[type="submit"]'
    ]

    let nextClicked = false
    for (const selector of nextButtonSelectors) {
      try {
        const element = await contextPage.$(selector)
        if (element) {
          const isVisible = await contextPage.evaluate(el => {
            const htmlEl = el as HTMLElement
            const disabled = 'disabled' in htmlEl ? (htmlEl as HTMLInputElement).disabled : false
            return htmlEl.offsetWidth > 0 && htmlEl.offsetHeight > 0 && !disabled
          }, element)

          if (!isVisible) {
            console.log(`[${new Date().toISOString()}] ⚠️ NEXT BUTTON NOT VISIBLE: ${selector}`)
            continue
          }

          await element.click()
          console.log(`[${new Date().toISOString()}] ✅ NEXT BUTTON CLICKED USING: ${selector}`)
          nextClicked = true
          break
        }
      } catch (e) {
        console.log(`[${new Date().toISOString()}] ⚠️ ERROR WITH NEXT BUTTON SELECTOR ${selector}:`, e instanceof Error ? e.message : String(e))
        continue
      }
    }

    if (!nextClicked) {
      console.log(`[${new Date().toISOString()}] ❌ COULD NOT CLICK NEXT BUTTON`)
      return null
    }

    // Wait for password field to become visible
    console.log(`[${new Date().toISOString()}] ⏳ STEP 3: WAITING FOR PASSWORD FIELD`)
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Take screenshot after clicking next
    try {
      await page.screenshot({ path: 'public/debug-after-next.png', fullPage: true })
      console.log(`[${new Date().toISOString()}] 📸 AFTER NEXT SCREENSHOT SAVED TO public/debug-after-next.png`)
    } catch (screenshotError) {
      console.log(`[${new Date().toISOString()}] ⚠️ COULD NOT SAVE AFTER NEXT SCREENSHOT:`, screenshotError instanceof Error ? screenshotError.message : String(screenshotError))
    }

    // Fill in password - based on debug output, it's: name="PASSWORD", id="password", type="password"
    console.log(`[${new Date().toISOString()}] 🔐 STEP 4: FILLING PASSWORD FIELD`)
    const passwordSelectors = [
      'input[name="PASSWORD"]',
      '#password',
      'input[type="password"]',
      'input[id="password"]'
    ]

    let passwordFilled = false
    for (const selector of passwordSelectors) {
      try {
        const element = await contextPage.$(selector)
        if (element) {
          // Check if element is visible and enabled
          const isVisible = await contextPage.evaluate(el => {
            const htmlEl = el as HTMLElement
            const disabled = 'disabled' in htmlEl ? (htmlEl as HTMLInputElement).disabled : false
            return htmlEl.offsetWidth > 0 && htmlEl.offsetHeight > 0 && !disabled
          }, element)

          if (!isVisible) {
            console.log(`[${new Date().toISOString()}] ⚠️ PASSWORD ELEMENT NOT VISIBLE: ${selector}`)
            continue
          }

          // Clear the field by selecting all and deleting
          await element.click({ clickCount: 3 }) // Select all text
          await element.type('', { delay: 50 }) // Clear
          await element.type(password, { delay: 100 })

          console.log(`[${new Date().toISOString()}] ✅ PASSWORD FILLED USING: ${selector}`)
          passwordFilled = true
          break
        }
      } catch (e) {
        console.log(`[${new Date().toISOString()}] ⚠️ ERROR WITH PASSWORD SELECTOR ${selector}:`, e instanceof Error ? e.message : String(e))
        continue
      }
    }

    if (!passwordFilled) {
      console.log(`[${new Date().toISOString()}] ❌ COULD NOT FILL PASSWORD FIELD`)
      return null
    }

    // Wait a bit for the Sign In button to become visible after password entry
    console.log(`[${new Date().toISOString()}] ⏳ WAITING FOR SIGN IN BUTTON TO APPEAR`)
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Click Sign In button - look for button with "Sign In" text
    console.log(`[${new Date().toISOString()}] 🖱️ STEP 5: CLICKING SIGN IN BUTTON`)

    let signInClicked = false

    // Try to find button by evaluating the page (since CSS selectors don't support text content)
    try {
      const signInButton = await contextPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]'))
        return buttons.find(btn => {
          const htmlBtn = btn as HTMLButtonElement
          const text = btn.textContent?.trim()
          const style = window.getComputedStyle(btn)
          const isVisible = htmlBtn.offsetWidth > 0 && htmlBtn.offsetHeight > 0 &&
                           style.display !== 'none' && style.visibility !== 'hidden' &&
                           !htmlBtn.disabled
          return isVisible && (text === 'Sign In' || text?.includes('Sign In'))
        })
      })

      if (signInButton) {
        console.log(`[${new Date().toISOString()}] 🖱️ CLICKING SIGN IN BUTTON`)
        // Click the button by its index in the buttons array
        const buttons = await contextPage.$$('button, input[type="submit"]')
        for (let i = 0; i < buttons.length; i++) {
          const buttonText = await contextPage.evaluate(btn => btn.textContent?.trim(), buttons[i])
          if (buttonText === 'Sign In' || buttonText?.includes('Sign In')) {
            await buttons[i].click()
            signInClicked = true
            break
          }
        }
      }
    } catch (e) {
      console.log(`[${new Date().toISOString()}] ⚠️ ERROR FINDING SIGN IN BUTTON:`, e instanceof Error ? e.message : String(e))
    }

    // If Sign In button not found, try submitting the form directly
    if (!signInClicked) {
      console.log(`[${new Date().toISOString()}] 📝 SIGN IN BUTTON NOT FOUND, TRYING FORM SUBMISSION`)
      try {
        const formSubmitted = await contextPage.evaluate(() => {
          const forms = document.querySelectorAll('form')
          if (forms.length > 0) {
            const form = forms[0] as HTMLFormElement
            form.submit()
            return true
          }
          return false
        })

        if (formSubmitted) {
          console.log(`[${new Date().toISOString()}] ✅ FORM SUBMITTED DIRECTLY`)
          signInClicked = true
        }
      } catch (e) {
        console.log(`[${new Date().toISOString()}] ⚠️ FORM SUBMISSION FAILED:`, e instanceof Error ? e.message : String(e))
      }
    }

    // Last resort: try clicking any visible submit button
    if (!signInClicked) {
      console.log(`[${new Date().toISOString()}] 🔄 LAST RESORT: LOOKING FOR ANY VISIBLE SUBMIT BUTTON`)
      try {
        const allButtons = await contextPage.$$eval('button, input[type="submit"]', buttons =>
          buttons.map((btn, index) => ({
            index,
            text: btn.textContent?.trim(),
            tagName: btn.tagName,
            type: btn.getAttribute('type'),
            visible: (() => {
              const htmlBtn = btn as HTMLButtonElement
              const style = window.getComputedStyle(btn)
              return htmlBtn.offsetWidth > 0 && htmlBtn.offsetHeight > 0 &&
                     style.display !== 'none' && style.visibility !== 'hidden' &&
                     !htmlBtn.disabled
            })()
          })).filter(btn => btn.visible)
        )

        console.log(`[${new Date().toISOString()}] 📋 ALL VISIBLE BUTTONS:`, allButtons)

        if (allButtons.length > 0) {
          const firstVisibleButton = allButtons[0]
          console.log(`[${new Date().toISOString()}] 🖱️ CLICKING FIRST VISIBLE BUTTON: "${firstVisibleButton.text}" (index: ${firstVisibleButton.index})`)

          const buttons = await contextPage.$$('button, input[type="submit"]')
          await buttons[firstVisibleButton.index].click()
          signInClicked = true
        }
      } catch (e) {
        console.log(`[${new Date().toISOString()}] ⚠️ ERROR WITH LAST RESORT BUTTON CLICK:`, e instanceof Error ? e.message : String(e))
      }
    }

    if (!signInClicked) {
      console.log(`[${new Date().toISOString()}] ❌ COULD NOT CLICK SIGN IN BUTTON`)
      return null
    }

    // Wait for navigation or error message
    console.log(`[${new Date().toISOString()}] ⏳ WAITING FOR LOGIN RESPONSE`)
    await new Promise(resolve => setTimeout(resolve, 5000))

    // Take another screenshot after login attempt
    try {
      await page.screenshot({ path: 'public/debug-after-login.png', fullPage: true })
      console.log(`[${new Date().toISOString()}] 📸 POST-LOGIN SCREENSHOT SAVED TO public/debug-after-login.png`)
    } catch (screenshotError) {
      console.log(`[${new Date().toISOString()}] ⚠️ COULD NOT SAVE POST-LOGIN SCREENSHOT:`, screenshotError instanceof Error ? screenshotError.message : String(screenshotError))
    }

    const currentUrl = page.url()
    console.log(`[${new Date().toISOString()}] 📍 CURRENT URL AFTER LOGIN: ${currentUrl}`)

    // Check for error messages with more comprehensive selectors
    console.log(`[${new Date().toISOString()}] 🔍 CHECKING FOR ERROR MESSAGES`)
    const errorSelectors = [
      '.error', '.alert-danger', '.alert-error', '[class*="error"]', '[class*="alert"]',
      '[class*="invalid"]', '[class*="wrong"]', '[class*="failed"]',
      'div:contains("Invalid")', 'div:contains("Wrong")', 'div:contains("Failed")',
      'span:contains("Invalid")', 'span:contains("Wrong")', 'span:contains("Failed")',
      'p:contains("Invalid")', 'p:contains("Wrong")', 'p:contains("Failed")'
    ]

    for (const selector of errorSelectors) {
      try {
        const errorElement = await page.$(selector)
        if (errorElement) {
          const errorText = await page.evaluate(el => el.textContent, errorElement)
          console.log(`[${new Date().toISOString()}] ⚠️ FOUND ERROR MESSAGE: ${errorText}`)
          if (errorText && (errorText.toLowerCase().includes('invalid') ||
                           errorText.toLowerCase().includes('wrong') ||
                           errorText.toLowerCase().includes('failed') ||
                           errorText.toLowerCase().includes('incorrect'))) {
            console.log(`[${new Date().toISOString()}] ❌ INVALID CREDENTIALS DETECTED`)
            return null // Invalid credentials
          }
        }
      } catch {
        continue
      }
    }

    // Check if we're still on login page or got redirected back (failed login)
    if (currentUrl.includes('login') || currentUrl === 'https://academia.srmist.edu.in/' ||
        currentUrl.includes('signin') || currentUrl.includes('auth')) {
      console.log(`[${new Date().toISOString()}] ❌ STILL ON LOGIN PAGE - AUTHENTICATION FAILED`)
      return null // Login failed
    }

    // Navigate to My Attendance page
    console.log(`[${new Date().toISOString()}] 📊 NAVIGATING TO ATTENDANCE PAGE`)
    await page.goto('https://academia.srmist.edu.in/#Page:My_Attendance', {
      waitUntil: 'networkidle0',
      timeout: 30000
    })

    // Wait for attendance page to load
    console.log(`[${new Date().toISOString()}] ⏳ WAITING FOR ATTENDANCE PAGE TO LOAD`)
    await new Promise(resolve => setTimeout(resolve, 5000))

    // Take screenshot of attendance page
    try {
      await page.screenshot({ path: 'public/debug-attendance.png', fullPage: true })
      console.log(`[${new Date().toISOString()}] 📸 ATTENDANCE PAGE SCREENSHOT SAVED TO public/debug-attendance.png`)
    } catch (screenshotError) {
      console.log(`[${new Date().toISOString()}] ⚠️ COULD NOT SAVE ATTENDANCE SCREENSHOT:`, screenshotError instanceof Error ? screenshotError.message : String(screenshotError))
    }

    // Extract student data from the specific table structure
    console.log(`[${new Date().toISOString()}] 📋 EXTRACTING STUDENT DATA`)
    const studentData = await page.evaluate(() => {
      // Look for the student information table
      const table = document.querySelector('table[cellspacing="1"][cellpadding="1"]') ||
                   document.querySelector('table[align="center"]') ||
                   document.querySelector('table')

      if (!table) {
        console.log('No student data table found')
        return {
          fullName: null,
          registrationNumber: null,
          program: null,
          department: null,
          specialization: null,
          semester: null,
          batch: null
        }
      }

      // Extract data from table rows
      const rows = table.querySelectorAll('tr')
      let fullName = null
      let registrationNumber = null
      let program = null
      let department = null
      let specialization = null
      let semester = null
      let batch = null

      for (const row of rows) {
        const cells = row.querySelectorAll('td')
        if (cells.length >= 2) {
          const label = cells[0].textContent?.trim().toLowerCase()
          const value = cells[1].querySelector('strong')?.textContent?.trim() ||
                       cells[1].textContent?.trim()

          if (label?.includes('registration number') || label?.includes('reg. no.')) {
            registrationNumber = value || null
          } else if (label?.includes('name')) {
            fullName = value || null
          } else if (label?.includes('program')) {
            program = value || null
          } else if (label?.includes('department')) {
            department = value || null
          } else if (label?.includes('specialization')) {
            specialization = value || null
          } else if (label?.includes('semester')) {
            semester = value || null
          }

          // Handle batch which might be in the same row as semester
          if (cells.length >= 5 && cells[2].textContent?.trim().toLowerCase().includes('batch')) {
            batch = cells[4].querySelector('strong')?.textContent?.trim() ||
                   cells[4].textContent?.trim() || null
          }
        }
      }

      // Fallback: try to find batch in a separate row
      if (!batch) {
        for (const row of rows) {
          const cells = row.querySelectorAll('td')
          if (cells.length >= 2) {
            const label = cells[0].textContent?.trim().toLowerCase()
            if (label?.includes('batch')) {
              batch = cells[1].querySelector('strong')?.textContent?.trim() ||
                     cells[1].textContent?.trim() || null
            }
          }
        }
      }

      return {
        fullName,
        registrationNumber,
        program,
        department,
        specialization,
        semester,
        batch
      }
    })

    console.log(`[${new Date().toISOString()}] 📊 EXTRACTED DATA:`, {
      fullName: studentData.fullName,
      registrationNumber: studentData.registrationNumber,
      program: studentData.program,
      department: studentData.department,
      specialization: studentData.specialization,
      semester: studentData.semester,
      batch: studentData.batch
    })

    return studentData

  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ SCRAPING ERROR:`, error)

    // Take error screenshot if possible
    if (browser) {
      try {
        const pages = await browser.pages()
        if (pages.length > 0) {
          await pages[0].screenshot({ path: 'public/debug-error.png', fullPage: true })
          console.log(`[${new Date().toISOString()}] 📸 ERROR SCREENSHOT SAVED TO public/debug-error.png`)
        }
      } catch (screenshotError) {
        console.error(`[${new Date().toISOString()}] ❌ COULD NOT TAKE ERROR SCREENSHOT:`, screenshotError)
      }
    }

    return null
  } finally {
    if (browser) {
      console.log(`[${new Date().toISOString()}] 🔒 CLOSING BROWSER`)
      await browser.close()
    }
  }
}
