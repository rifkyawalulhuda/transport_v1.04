[Skip to content](https://vcalendar.io/#VPContent)

[VCalendar](https://vcalendar.io/)

Search`` `K`

Main Navigation

3.1.2

[Changelog](https://github.com/nathanreyes/v-calendar/blob/v3/CHANGELOG.md)

[2.0](https://v2--vcalendar.netlify.app/)

[GitHub](https://github.com/nathanreyes/v-calendar)

Appearance

[GitHub](https://github.com/nathanreyes/v-calendar)

Menu

On this page

Sidebar Navigation

## Getting Started

[Installation](https://vcalendar.io/getting-started/installation)

[Upgrade Guide](https://vcalendar.io/getting-started/upgrade-guide)

## Calendar

[Theme](https://vcalendar.io/calendar/theme)

[Layouts](https://vcalendar.io/calendar/layouts)

[Navigation](https://vcalendar.io/calendar/navigation)

[Attributes](https://vcalendar.io/calendar/attributes)

[Dates](https://vcalendar.io/calendar/dates)

[API](https://vcalendar.io/calendar/api)

## Date Picker

[Basics](https://vcalendar.io/datepicker/basics)

[Time Picker](https://vcalendar.io/datepicker/time-picker)

[Time Rules](https://vcalendar.io/datepicker/time-rules)

[Slot Content](https://vcalendar.io/datepicker/slot-content)

[Custom Attributes](https://vcalendar.io/datepicker/custom-attributes)

[API](https://vcalendar.io/datepicker/api)

## i18n

[Locales](https://vcalendar.io/i18n/locales)

[Masks](https://vcalendar.io/i18n/masks)

[Timezones](https://vcalendar.io/i18n/timezones)

On this page

Table of Contents for current page

- [Theme](https://vcalendar.io/#theme)
- [Layouts](https://vcalendar.io/#layouts)
- [Attributes](https://vcalendar.io/#attributes)
- [Date Picker](https://vcalendar.io/#date-picker)

# VCalendar [​](https://vcalendar.io/\#vcalendar)

Welcome to VCalendar, a calendar a date picker plugin for Vue.js.

Version 3 brings a host of feature improvements and bug fixes, including [weekly views](https://vcalendar.io/calendar/layouts#weekly-view), a [simplified time picker](https://vcalendar.io/datepicker/time-picker), [repeating date ranges](https://vcalendar.io/calendar/dates#repeating-dates), [time rules](https://vcalendar.io/datepicker/time-rules), and performance improvements.

If upgrading from version 2.0, be sure to view the [upgrade guide](https://vcalendar.io/getting-started/upgrade-guide) for breaking changes.

[Get Started](https://vcalendar.io/getting-started/installation) [View 2.0 Documentation](https://v2.vcalendar.io/)

## Theme [​](https://vcalendar.io/\#theme)

VCalendar provides attractive default styling based on simple colors and dark mode.

GrayRedOrangeYellowGreenTealBlueIndigoPurplePink

Dark Mode

April 2019

S

M

T

W

T

F

S

31

1

2

3

4

5

6

7

8

9

10

11

12

13

14

15

16

17

18

19

20

21

22

23

24

25

26

27

28

29

30

1

2

3

4

5

6

7

8

9

10

11

Custom styling with class overrides and css variables are also available.

[Read more](https://vcalendar.io/calendar/theme)

## Layouts [​](https://vcalendar.io/\#layouts)

Calendars may be configured to adapt for multiple layouts. For example, weekly calendars can be used in constrained environments.

July 2023

Sun

Mon

Tue

Wed

Thu

Fri

Sat

2

3

4

5

6

7

8

## Reminders

- Mom and dad's anniversary



Sunday, 3:00 am


- Meeting with Jonas Stark



Tuesday, 9:30 am


- Mia's birthday party



Saturday, 12:00 pm


Also, calendars can also be configured for multi-row and multi-column layouts.

July 2026

S

M

T

W

T

F

S

28

29

30

1

2

3

4

5

6

7

8

9

10

11

12

13

14

15

16

17

18

19

20

21

22

23

24

25

26

27

28

29

30

31

1

2

3

4

5

6

7

8

August 2026

S

M

T

W

T

F

S

26

27

28

29

30

31

1

2

3

4

5

6

7

8

9

10

11

12

13

14

15

16

17

18

19

20

21

22

23

24

25

26

27

28

29

30

31

1

2

3

4

5

[Read more](https://vcalendar.io/calendar/layouts)

## Attributes [​](https://vcalendar.io/\#attributes)

Decorate calendars with attributes on specified dates or date ranges. They can even be displayed for repeating date patterns.

July 2026

S

M

T

W

T

F

S

28

29

30

1

2

3

4

5

6

7

8

9

10

11

12

13

14

15

16

17

18

19

20

21

22

23

24

25

26

27

28

29

30

31

1

2

3

4

5

6

7

8

[Read more](https://vcalendar.io/calendar/attributes)

## Date Picker [​](https://vcalendar.io/\#date-picker)

`VDatePicker` is a feature-rich date picker component implemented as a wrapper for `VCalendar`, which can easily bind to a variety of date formats.

Value:7/18/2026, 2:34:18 PM (Date)

July 2026

S

M

T

W

T

F

S

28

29

30

1

2

3

4

5

6

7

8

9

10

11

12

13

14

15

16

17

18

19

20

21

22

23

24

25

26

27

28

29

30

31

1

2

3

4

5

6

7

8

[Read more](https://vcalendar.io/datepicker/basics)

Even date ranges are supported

Start:1/6/2020, 12:00:00 AM (date)

End:1/10/2020, 12:00:00 AM (date)

January 2020

S

M

T

W

T

F

S

29

30

31

1

2

3

4

5

6

7

8

9

10

11

12

13

14

15

16

17

18

19

20

21

22

23

24

25

26

27

28

29

30

31

1

2

3

4

5

6

7

8

[Read more](https://vcalendar.io/datepicker/basics#date-ranges)

Time selection is also supported with configurable hour, minute, second and millisecond accuracy.

Value:7/18/2026, 2:34:18 PM (Date)

July 2026

S

M

T

W

T

F

S

28

29

30

1

2

3

4

5

6

7

8

9

10

11

12

13

14

15

16

17

18

19

20

21

22

23

24

25

26

27

28

29

30

31

1

2

3

4

5

6

7

8

SatJul182026

000102030405060708091011121314151617181920212223

:

000102030405060708091011121314151617181920212223242526272829303132333435363738394041424344454647484950515253545556575859

[Read more](https://vcalendar.io/datepicker/time-picker)

Flexible rules can also be easily configured to dynamically limit time selection, like afternoon hours and 5-minute increments.

Value:7/18/2026, 2:35:18 PM (Date)

July 2026

S

M

T

W

T

F

S

28

29

30

1

2

3

4

5

6

7

8

9

10

11

12

13

14

15

16

17

18

19

20

21

22

23

24

25

26

27

28

29

30

31

1

2

3

4

5

6

7

8

SatJul182026

1212345678

:

000510152025303540455055

PM

[Read more](https://vcalendar.io/datepicker/time-rules)

[Next pageInstallation](https://vcalendar.io/getting-started/installation)

Released under the MIT License.

Copyright © 2017-present Nathan Reyes