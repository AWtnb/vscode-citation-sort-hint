# citation-sort-hint README

For those who need to sort citation list manually.

## Features

![img](./images/demo.png)

`citation-sort-hint.focus` reduces unnecessary information for organizing reference list.

+ Lines that do not start with ASCII will be skipped.
+ The line will be split by spaces, and dim all elements except for:
    + Surname
        + Elements that follows or precedes abbreviation (_i.e._ single capital ends with `.`).
    + Published year
        + Elements that contains 4 consecutive numbers.
+ Context is not considered. If above conditions are met, non-personal names or 4-digit number other than publshed year will also be matched.
+ In order to reset dimming, run `citation-sort-hint.reset` command.

---

**Enjoy!**
